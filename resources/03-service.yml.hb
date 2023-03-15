{{#if prometheus.enabled}}
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: lens-metrics
  annotations:
    prometheus.io/scrape: 'true'
spec:
  type: ClusterIP
  selector:
    name: prometheus
  ports:
    - name: web
      protocol: TCP
      port: 80
      targetPort: 9090
{{/if}}
