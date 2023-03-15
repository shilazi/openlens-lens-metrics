/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import React from "react";
import type { Common } from "@k8slens/extensions";
import { Renderer } from "@k8slens/extensions";
import { observer } from "mobx-react";
import { computed, observable, makeObservable } from "mobx";
import type { MetricsConfiguration } from "./metrics-feature";
import { MetricsFeature } from "./metrics-feature";

const {
  K8sApi: {
    forCluster, StatefulSet, DaemonSet, Deployment,
  },
  Component: {
    SubTitle, Switch, Button,
  },
} = Renderer;

export interface MetricsSettingsProps {
  cluster: Common.Catalog.KubernetesCluster;
}

@observer
export class MetricsSettings extends React.Component<MetricsSettingsProps> {
  constructor(props: MetricsSettingsProps) {
    super(props);
    makeObservable(this);
  }

  @observable featureStates = {
    prometheus: false,
    kubeStateMetrics: false,
    nodeExporter: false,
  };
  @observable canUpgrade = false;
  @observable upgrading = false;
  @observable changed = false;
  @observable inProgress = false;

  config: MetricsConfiguration = {
    prometheus: {
      enabled: false,
    },
    persistence: {
      enabled: false,
      storageClass: null,
      size: "20Gi", // kubernetes yaml value (no B suffix)
    },
    nodeExporter: {
      enabled: false,
    },
    retention: {
      time: "2d",
      size: "5GiB", // argument for prometheus (requires B suffix)
    },
    kubeStateMetrics: {
      enabled: false,
    },
    alertManagers: null,
    replicas: 1,
    storageClass: null,
  };
  feature: MetricsFeature;

  @computed get isTogglable() {
    if (this.inProgress) return false;
    if (this.props.cluster.status.phase !== "connected") return false;
    if (this.canUpgrade) return false;
    if (!this.isActiveMetricsProvider) return false;

    return true;
  }

  get metricsProvider() {
    return this.props.cluster.spec?.metrics?.prometheus?.type || "";
  }

  get isActiveMetricsProvider() {
    return (!this.metricsProvider || this.metricsProvider === "lens");
  }

  async componentDidMount() {
    this.feature = new MetricsFeature(this.props.cluster);

    await this.updateFeatureStates();
  }

  async updateFeatureStates() {
    const status = await this.feature.getStatus();

    this.canUpgrade = status.canUpgrade;

    if (this.canUpgrade) {
      this.changed = true;
    }

    const statefulSet = forCluster(this.props.cluster, StatefulSet);

    try {
      await statefulSet.get({ name: "prometheus", namespace: "lens-metrics" });
      this.featureStates.prometheus = true;
    } catch(e) {
      if (e?.error?.code === 404) {
        this.featureStates.prometheus = false;
      } else {
        this.featureStates.prometheus = undefined;
      }
    }

    const deployment = forCluster(this.props.cluster, Deployment);

    try {
      await deployment.get({ name: "kube-state-metrics", namespace: "lens-metrics" });
      this.featureStates.kubeStateMetrics = true;
    } catch(e) {
      if (e?.error?.code === 404) {
        this.featureStates.kubeStateMetrics = false;
      } else {
        this.featureStates.kubeStateMetrics = undefined;
      }
    }

    const daemonSet = forCluster(this.props.cluster, DaemonSet);

    try {
      await daemonSet.get({ name: "node-exporter", namespace: "lens-metrics" });
      this.featureStates.nodeExporter = true;
    } catch(e) {
      if (e?.error?.code === 404) {
        this.featureStates.nodeExporter = false;
      } else {
        this.featureStates.nodeExporter = undefined;
      }
    }
  }

  async save() {
    this.config.prometheus.enabled = !!this.featureStates.prometheus;
    this.config.kubeStateMetrics.enabled = !!this.featureStates.kubeStateMetrics;
    this.config.nodeExporter.enabled = !!this.featureStates.nodeExporter;

    this.inProgress = true;

    try {
      if (!this.config.prometheus.enabled && !this.config.kubeStateMetrics.enabled && !this.config.nodeExporter.enabled) {
        await this.feature.uninstall(this.config);
      } else {
        await this.feature.install(this.config);
      }
    } finally {
      this.inProgress = false;
      this.changed = false;

      await this.updateFeatureStates();
    }
  }

  async togglePrometheus(enabled: boolean) {
    this.featureStates.prometheus = enabled;
    this.changed = true;
  }

  async toggleKubeStateMetrics(enabled: boolean) {
    this.featureStates.kubeStateMetrics = enabled;
    this.changed = true;
  }

  async toggleNodeExporter(enabled: boolean) {
    this.featureStates.nodeExporter = enabled;
    this.changed = true;
  }

  @computed get buttonLabel() {
    const allDisabled = !this.featureStates.kubeStateMetrics && !this.featureStates.nodeExporter && !this.featureStates.prometheus;

    if (this.inProgress && this.canUpgrade) return "Upgrading ...";
    if (this.inProgress && allDisabled) return "Uninstalling ...";
    if (this.inProgress) return "Applying ...";
    if (this.canUpgrade) return "Upgrade";

    if (this.changed && allDisabled) {
      return "Uninstall";
    }

    return "Apply";
  }

  render() {
    return (
      <section style={{ display: "flex", flexDirection: "column", rowGap: "1.5rem" }}>
        { this.props.cluster.status.phase !== "connected" && (
          <section>
            <p style={ { color: "var(--colorError)" } }>
              Lens Metrics settings requires established connection to the cluster.
            </p>
          </section>
        )}
        { !this.isActiveMetricsProvider && (
          <section>
            <p style={ { color: "var(--colorError)" } }>
              Other metrics provider is currently active. See &quot;Metrics&quot; tab for details.
            </p>
          </section>
        )}
        <section>
          <SubTitle title="Prometheus" />
          <Switch
            disabled={this.featureStates.kubeStateMetrics === undefined || !this.isTogglable}
            checked={!!this.featureStates.prometheus && this.props.cluster.status.phase == "connected"}
            onChange={checked => this.togglePrometheus(checked)}
            name="prometheus"
          >
            Enable bundled Prometheus metrics stack
          </Switch>
          <small className="hint">
            Enable timeseries data visualization (Prometheus stack) for your cluster.
          </small>
        </section>

        <section>
          <SubTitle title="Kube State Metrics" />
          <Switch
            disabled={this.featureStates.kubeStateMetrics === undefined || !this.isTogglable}
            checked={!!this.featureStates.kubeStateMetrics && this.props.cluster.status.phase == "connected"}
            onChange={checked => this.toggleKubeStateMetrics(checked)}
            name="kube-state-metrics"
          >
            Enable bundled kube-state-metrics stack
          </Switch>
          <small className="hint">
            Enable Kubernetes API object metrics for your cluster.
            Enable this only if you don&apos;t have existing kube-state-metrics stack installed.
          </small>
        </section>

        <section>
          <SubTitle title="Node Exporter" />
          <Switch
            disabled={this.featureStates.nodeExporter === undefined || !this.isTogglable}
            checked={!!this.featureStates.nodeExporter && this.props.cluster.status.phase == "connected"}
            onChange={checked => this.toggleNodeExporter(checked)}
            name="node-exporter"
          >
            Enable bundled node-exporter stack
          </Switch>
          <small className="hint">
            Enable node level metrics for your cluster.
            Enable this only if you don&apos;t have existing node-exporter stack installed.
          </small>
        </section>

        <section>
          <div>
            <Button
              primary
              label={this.buttonLabel}
              waiting={this.inProgress}
              onClick={() => this.save()}
              disabled={!this.changed}
              style={{ width: "20ch", padding: "0.5rem" }}
            />

            {this.canUpgrade && (
              <small className="hint">
                An update is available for enabled metrics components.
              </small>
            )}
          </div>
        </section>
      </section>
    );
  }
}
