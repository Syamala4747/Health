# Infrastructure

This directory contains all infrastructure-related configuration files for the ZenCare Mental Health Platform.

## 📁 Contents

### Core Configuration Files
- **docker-compose.yml** - Multi-container Docker orchestration
- **firebase.json** - Firebase project configuration
- **firestore.rules** - Firestore security rules
- **firestore.indexes.json** - Database indexing configuration
- **database.rules.json** - Realtime Database security rules

## 🐳 Docker Configuration

### docker-compose.yml
Orchestrates the entire application stack with the following services:

```yaml
services:
  frontend:    # React web application (Port 3000)
  backend:     # Node.js API server (Port 5000)
  mobile:      # React Native development server
  nginx:       # Reverse proxy and load balancer
  redis:       # Caching and session storage
```

### Usage
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild services
docker-compose up --build

# View logs
docker-compose logs [service-name]
```

### Service Details

#### Frontend Service
- **Image**: Custom Node.js image with React build
- **Port**: 3000
- **Environment**: Production optimized
- **Health Check**: HTTP endpoint monitoring

#### Backend Service
- **Image**: Custom Node.js image with Express
- **Port**: 5000
- **Dependencies**: Redis, Firebase
- **Health Check**: API health endpoint

#### Nginx Service
- **Image**: Official nginx:alpine
- **Port**: 80, 443
- **Purpose**: Reverse proxy, SSL termination, static file serving
- **Configuration**: Custom nginx.conf

#### Redis Service
- **Image**: Official redis:alpine
- **Port**: 6379
- **Purpose**: Session storage, caching, rate limiting
- **Persistence**: Volume mounted for data persistence

## 🔥 Firebase Configuration

### firebase.json
Main Firebase project configuration:

```json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "backend/functions",
    "predeploy": "npm --prefix backend/functions run build"
  }
}
```

### Features Configured
- **Hosting**: Frontend deployment configuration
- **Firestore**: Database rules and indexes
- **Functions**: Cloud Functions deployment
- **Authentication**: User authentication settings

## 🛡️ Security Rules

### firestore.rules
Comprehensive security rules for Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Role-based access for different collections
    match /assessments/{assessmentId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.role in ['counselor', 'admin']);
    }
  }
}
```

### Security Features
- **User Isolation**: Users can only access their own data
- **Role-Based Access**: Different permissions for different roles
- **Field Validation**: Data type and format validation
- **Audit Logging**: Security event logging

### database.rules.json
Legacy Realtime Database security rules (if used):

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## 📊 Database Indexing

### firestore.indexes.json
Optimized database indexes for performance:

```json
{
  "indexes": [
    {
      "collectionGroup": "assessments",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "role", "order": "ASCENDING"},
        {"fieldPath": "college.id", "order": "ASCENDING"}
      ]
    }
  ]
}
```

### Index Strategy
- **Query Optimization**: Indexes for common query patterns
- **Performance**: Fast data retrieval for dashboards
- **Scalability**: Prepared for large datasets

## 🚀 Deployment Configurations

### Environment Variables
```bash
# Production Environment
NODE_ENV=production
FIREBASE_PROJECT_ID=zencare-prod
API_URL=https://api.zencare.app
FRONTEND_URL=https://zencare.app

# Development Environment
NODE_ENV=development
FIREBASE_PROJECT_ID=zencare-dev
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### SSL/TLS Configuration
```nginx
# nginx SSL configuration
ssl_certificate /etc/ssl/certs/zencare.crt;
ssl_certificate_key /etc/ssl/private/zencare.key;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
```

## 📈 Monitoring and Logging

### Application Monitoring
```yaml
# Prometheus configuration
prometheus:
  image: prom/prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml

# Grafana dashboard
grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Log Aggregation
```yaml
# ELK Stack for log management
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
  
logstash:
  image: docker.elastic.co/logstash/logstash:7.15.0
  
kibana:
  image: docker.elastic.co/kibana/kibana:7.15.0
  ports:
    - "5601:5601"
```

## 🔧 Development vs Production

### Development Configuration
- **Hot Reloading**: Enabled for faster development
- **Debug Logging**: Verbose logging for troubleshooting
- **CORS**: Permissive CORS for local development
- **SSL**: Self-signed certificates

### Production Configuration
- **Optimization**: Minified builds and optimized images
- **Security**: Strict security headers and HTTPS
- **Monitoring**: Full monitoring and alerting
- **Scaling**: Auto-scaling configuration

## 🛠️ Maintenance

### Regular Tasks
```bash
# Update Docker images
docker-compose pull
docker-compose up -d

# Clean up unused images
docker system prune

# Backup database
firebase firestore:export gs://backup-bucket/$(date +%Y%m%d)

# Update Firebase indexes
firebase deploy --only firestore:indexes

# Update security rules
firebase deploy --only firestore:rules
```

### Health Checks
```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:5000/api/health

# Check database connectivity
firebase firestore:databases:list

# Monitor resource usage
docker stats
```

## 🚨 Troubleshooting

### Common Issues

#### Docker Issues
```bash
# Container won't start
docker-compose logs [service-name]

# Port conflicts
docker-compose down
lsof -i :3000

# Permission issues
sudo chown -R $USER:$USER ./
```

#### Firebase Issues
```bash
# Authentication issues
firebase auth:export auth_export.json
firebase auth:import auth_export.json

# Rule deployment failures
firebase firestore:rules:get
firebase deploy --only firestore:rules --debug
```

#### Performance Issues
```bash
# Database slow queries
firebase firestore:indexes:list

# High memory usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

---

## 🔗 Related Documentation

- [API Documentation](../docs/API_DOCUMENTATION.md)
- [Deployment Guide](../docs/DEPLOYMENT_GUIDE.md)
- [Frontend Documentation](../frontend/README.md)
- [Backend Documentation](../backend/README.md)

---

*Last Updated: [Current Date]*
*Version: 1.0.0*