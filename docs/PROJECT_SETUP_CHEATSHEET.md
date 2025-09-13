# Project Setup Cheatsheet
## AWS Serverless Application with CDK & TypeScript

This cheatsheet provides a step-by-step blueprint for setting up AWS serverless projects with modern DevOps practices.

---

## Prerequisites Checklist
- [ ] AWS Account configured
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] mise installed (`curl https://mise.run | sh`) - for version management
- [ ] Node.js 20+ installed via mise (`mise use node@20`)
- [ ] Git installed (`git --version`)
- [ ] CDK CLI installed (`npm install -g aws-cdk`)

---

## 1. Project Initialization

### Set Up Version Management with mise
```bash
# Create mise configuration for consistent tooling
cat > .mise.toml << 'EOF'
[tools]
node = "20.11.0"    # Latest Node.js that Lambda supports
python = "3.12"     # For AWS CLI and CDK
aws-cdk = "latest"  # Infrastructure as Code tool
EOF

# Or use the simpler .tool-versions format
cat > .tool-versions << 'EOF'
node 20.11.0
python 3.12
EOF

# Install and activate the specified versions
mise install
mise use

# Verify correct versions are active
node --version  # Should show v20.11.0
```
**Why**: Ensures all developers and CI/CD use identical tool versions, matching Lambda's runtime. Prevents "works on my machine" issues.

### Create Base Directory Structure
```bash
# Create the main project directory
mkdir <project-name> && cd <project-name>

# Initialize git repository (do this first for proper .gitignore)
git init

# Create folder structure for serverless application
mkdir -p backend/src backend/tests frontend infrastructure .github/workflows
```
**Why**: Organized structure separates concerns - backend logic, frontend assets, infrastructure code, and CI/CD pipelines.

---

## 2. Infrastructure Setup (CDK with TypeScript)

### Initialize CDK Project
```bash
# Navigate to infrastructure directory
cd infrastructure

# Initialize CDK app with TypeScript
# This creates a complete CDK project with TypeScript config, sample stack, and dependencies
npx cdk init app --language typescript

# Install additional CDK constructs as needed
npm install @aws-cdk/aws-lambda-nodejs-alpha
```
**Why**: CDK init creates all boilerplate for Infrastructure as Code - including tsconfig, jest tests, and CDK app entry point.

### Verify CDK Setup
```bash
# Bootstrap CDK (first time only per AWS account/region)
# This creates an S3 bucket for CDK assets and IAM roles
cdk bootstrap

# List stacks (should show your app stack)
cdk list
```
**Why**: Bootstrap prepares your AWS account for CDK deployments. Required once per account/region.

---

## 3. Backend Setup (Lambda Functions with TypeScript)

### Initialize TypeScript Backend
```bash
# Navigate to backend directory
cd ../backend

# Initialize Node.js project
npm init -y

# Install TypeScript and AWS dependencies
npm install --save-dev typescript @types/node @types/aws-lambda esbuild
npm install aws-sdk

# Initialize TypeScript configuration
npx tsc --init
```
**Why**: Sets up TypeScript compilation for Lambda functions with proper typing for AWS services.

### Configure TypeScript for Lambda
```bash
# Update tsconfig.json with Lambda-optimized settings
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2023",      # Node 20 supports ES2023
    "module": "commonjs",    # Lambda expects CommonJS
    "lib": ["ES2023"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF
```
**Why**: Configures TypeScript for Node.js 20 Lambda runtime with proper module resolution and type checking. Uses CommonJS for Lambda compatibility.

### Add Build Scripts
```bash
# Update package.json scripts section
npm pkg set scripts.build="tsc"
npm pkg set scripts.watch="tsc -w"
npm pkg set scripts.test="jest"
npm pkg set scripts.lint="eslint src/"
```
**Why**: Standard scripts for building, testing, and linting your Lambda functions.

---

## 4. Frontend Setup (Static SPA)

### Initialize Frontend
```bash
# Navigate to frontend directory
cd ../frontend

# For React/Vue/Angular projects:
# npx create-react-app . --template typescript
# OR
# npm create vite@latest . -- --template react-ts

# For vanilla HTML/CSS/JS (simple start):
touch index.html app.js style.css
```
**Why**: Frontend will be deployed to S3 and served via CloudFront. Choose framework based on project needs.

---

## 5. CI/CD Setup (GitHub Actions)

### Create Basic Workflow
```bash
# Create GitHub Actions workflow
cat > ../.github/workflows/deploy.yml << 'EOF'
name: Deploy to AWS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: |
          cd backend
          npm ci
          npm test
          npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy CDK
        run: |
          cd infrastructure
          npm ci
          npx cdk deploy --require-approval never
EOF
```
**Why**: Automates testing and deployment on every push to main branch. Ensures code quality and consistent deployments.

---

## 6. Local Development Setup

### Choose Your Local Development Environment

Before deploying to AWS, you'll want to run and test your serverless application locally. Here are your options:

#### Option 1: LocalStack (Recommended for DevOps)
**What it is**: Docker-based AWS service emulator that runs 80+ AWS services locally.

```bash
# Install LocalStack CLI
pip install localstack

# Start LocalStack (basic services)
localstack start

# Or with Docker Compose (add to docker-compose.yml):
version: '3.8'
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=lambda,apigateway,dynamodb,s3,cognito-idp,cloudformation
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"

# Deploy CDK to LocalStack instead of AWS
cdklocal deploy
```

**Pros**:
- **Most comprehensive**: 80+ AWS services (Lambda, DynamoDB, S3, Cognito, CloudFormation, etc.)
- **Realistic simulation**: Uses same APIs as real AWS
- **CDK/SAM compatible**: Deploy infrastructure locally
- **Perfect for DevOps**: Test entire infrastructure stack
- **Persistent data**: Survives container restarts with proper config
- **CI/CD friendly**: Great for integration tests

**Cons**:
- **Resource intensive**: Requires Docker and decent RAM
- **Setup complexity**: More moving parts than simple alternatives
- **Pro features**: Advanced services require paid license

**Free vs Pro**:
- **Community (Free)**: Core services (Lambda, API Gateway, DynamoDB, S3, IAM basics)
- **Pro ($25-99/month)**: Advanced features, persistence, multi-region, extended services

**When to choose**: 
- Complex multi-service applications
- DevOps/infrastructure testing
- Team environments
- Need realistic AWS behavior

#### Option 2: AWS SAM CLI
**What it is**: Official AWS tool for running Lambda and API Gateway locally.

```bash
# Install SAM CLI
# Create template.yaml in project root
sam local start-api --port 3001

# Run specific Lambda
sam local invoke HelloFunction

# Start DynamoDB separately
docker run -p 8000:8000 amazon/dynamodb-local
```

**Pros**:
- **Official AWS tool**: Most accurate Lambda simulation
- **Simple setup**: Works out of the box
- **Good documentation**: Extensive AWS support
- **Free forever**: No licensing costs
- **Docker-based**: Consistent runtime environment

**Cons**:
- **Limited services**: Mainly Lambda + API Gateway
- **Separate containers**: Need multiple tools for full stack
- **No infrastructure**: Can't test CDK deployments locally
- **Manual configuration**: Each service configured separately

**When to choose**:
- Simple Lambda functions
- Official AWS tooling preference
- Learning serverless basics
- Minimal local testing needs

#### Option 3: Serverless Framework Offline
**What it is**: Popular serverless plugin for local development.

```bash
# Install Serverless Framework
npm install -g serverless
npm install --save-dev serverless-offline

# Add to serverless.yml
plugins:
  - serverless-offline

# Start local development
serverless offline start
```

**Pros**:
- **Hot reload**: Automatic code reloading
- **Plugin ecosystem**: Many community plugins
- **Simple config**: YAML-based configuration
- **Good for development**: Fast iteration cycle

**Cons**:
- **Limited AWS services**: Mainly Lambda + HTTP
- **Different from CDK**: Uses Serverless Framework, not CDK
- **Framework lock-in**: Requires Serverless Framework config
- **Less realistic**: Simplified AWS simulation

**When to choose**:
- Using Serverless Framework (not CDK)
- Rapid development iteration
- Simple API development
- Don't need infrastructure testing

#### Option 4: Express.js Wrapper (Quick Testing)
**What it is**: Wrap Lambda handlers in Express for quick local testing.

```typescript
// backend/src/local-dev.ts
import express from 'express';
import { handler } from './index';

const app = express();
app.use(express.json());

app.get('/', async (req, res) => {
  // Convert Express request to Lambda event
  const event = {
    httpMethod: 'GET',
    path: req.path,
    queryStringParameters: req.query,
    headers: req.headers,
    body: JSON.stringify(req.body),
    requestContext: { requestId: 'local-' + Date.now() }
  };
  
  const result = await handler(event as any, {} as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.listen(3000, () => console.log('Local Lambda on port 3000'));
```

**Pros**:
- **Fastest setup**: Just Node.js, no Docker
- **Familiar**: Standard Express.js development
- **Lightweight**: Minimal resource usage
- **Debugging friendly**: Easy to add breakpoints

**Cons**:
- **Not realistic**: Missing Lambda runtime constraints
- **Manual mapping**: Convert between Express and Lambda formats
- **No other AWS services**: Just HTTP endpoints
- **Maintenance overhead**: Keep wrapper in sync with Lambda changes

**When to choose**:
- Quick prototyping
- No Docker available
- Simple HTTP API testing
- Familiar with Express.js

### Recommendation Matrix

| Use Case | Recommended Tool | Why |
|----------|------------------|-----|
| **DevOps/Infrastructure** | LocalStack | Full AWS stack, infrastructure testing |
| **Simple Lambda APIs** | SAM CLI | Official tool, realistic Lambda runtime |
| **Rapid Prototyping** | Express Wrapper | Fastest iteration, familiar tools |
| **Serverless Framework Users** | Serverless Offline | Matches deployment tool |
| **Learning/Education** | SAM CLI | Official, good documentation |
| **Enterprise/Teams** | LocalStack Pro | Advanced features, team collaboration |

---

## 7. Docker Multi-Environment Setup

### Create Docker Compose Structure

```bash
# Base configuration (shared services)
cat > docker-compose.base.yml << 'EOF'
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    networks:
      - serverless-network

volumes:
  localstack-data:

networks:
  serverless-network:
    driver: bridge
EOF

# Development overrides
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'
services:
  localstack:
    image: localstack/localstack:latest
    container_name: serverless-localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=lambda,apigateway,dynamodb,s3,cognito-idp,cloudformation,iam,sts
      - DEBUG=1
      - LAMBDA_EXECUTOR=docker
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "localstack-data:/var/lib/localstack"
    networks:
      - serverless-network

  backend:
    build:
      target: builder
    container_name: serverless-backend-dev
    volumes:
      - ./backend/src:/app/src
      - ./backend/dist:/app/dist
    environment:
      - NODE_ENV=development
      - AWS_ENDPOINT_URL=http://localstack:4566
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=test
      - AWS_SECRET_ACCESS_KEY=test
    depends_on:
      - localstack
    command: npm run watch

  test:
    build:
      context: ./backend
      target: builder
    container_name: serverless-tests
    volumes:
      - ./backend:/app
    environment:
      - NODE_ENV=test
      - AWS_ENDPOINT_URL=http://localstack:4566
    depends_on:
      - localstack
    networks:
      - serverless-network
    command: npm run test:watch
    profiles:
      - test
EOF

# Production overrides
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'
services:
  backend:
    build:
      target: production
    container_name: serverless-backend-prod
    environment:
      - NODE_ENV=production
      - AWS_REGION=${AWS_REGION:-us-east-1}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF
```
**Why Multi-file Compose**: Separates concerns, avoids duplication, enables environment-specific configuration without code changes.

### Create Convenience Scripts
```bash
# Create scripts directory
mkdir scripts

# Development script
cat > scripts/dev.sh << 'EOF'
#!/bin/bash
docker-compose -f docker-compose.base.yml -f docker-compose.dev.yml up --build "$@"
EOF

# Test script
cat > scripts/test.sh << 'EOF'
#!/bin/bash
docker-compose -f docker-compose.base.yml -f docker-compose.dev.yml --profile test up "$@"
EOF

# Production script
cat > scripts/prod.sh << 'EOF'
#!/bin/bash
docker-compose -f docker-compose.base.yml -f docker-compose.prod.yml up --build "$@"
EOF

# Make scripts executable
chmod +x scripts/*.sh
```

### Docker Commands Reference
```bash
# Development with LocalStack
docker-compose -f docker-compose.base.yml -f docker-compose.dev.yml up --build

# Development with tests
docker-compose -f docker-compose.base.yml -f docker-compose.dev.yml --profile test up

# Production
docker-compose -f docker-compose.base.yml -f docker-compose.prod.yml up

# Using convenience scripts
./scripts/dev.sh        # Start development environment
./scripts/test.sh       # Start with test runner
./scripts/prod.sh       # Start production environment
```

---

## 8. CDK Infrastructure Setup

### Install CDK Dependencies

```bash
# Add AWS CLI to mise for system-level AWS operations
echo "aws-cli latest" >> .tool-versions
mise install

# Install CDK at project level (recommended approach)
cd infrastructure
npm install --save-dev aws-cdk aws-cdk-local
npm install --save-dev @aws-cdk/aws-lambda-nodejs-alpha
npm install aws-cdk-lib constructs
```

**Why hybrid approach**: System tools (aws-cli) via mise for consistency, project tools (CDK) via npm for version control.

### Configure CDK Stack for LocalStack

```typescript
// infrastructure/lib/infrastructure-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as path from 'path';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function pointing to compiled TypeScript
    const helloLambda = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
    });

    // API Gateway with CORS
    const api = new apigateway.RestApi(this, 'ServerlessAuthApi', {
      restApiName: 'Serverless Auth Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Connect Lambda to API Gateway
    const integration = new apigateway.LambdaIntegration(helloLambda);
    api.root.addMethod('GET', integration);
    
    // Health check endpoint
    api.root.addResource('health').addMethod('GET', integration);

    // Output API URL for testing
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });
  }
}
```

### Development Workflow

```bash
# 1. Start LocalStack
./scripts/dev.sh

# 2. Build Lambda function
cd backend && npm run build

# 3. Deploy to LocalStack (first time)
cd ../infrastructure
npx cdklocal bootstrap

# 4. Deploy infrastructure
npx cdklocal deploy

# 5. Test API
curl http://localhost:4566/restapis/[api-id]/dev/_user_request_/
```

### CDK Commands Reference

```bash
# LocalStack commands
npx cdklocal bootstrap    # Setup CDK in LocalStack (one time)
npx cdklocal deploy       # Deploy to LocalStack
npx cdklocal destroy      # Remove from LocalStack
npx cdklocal diff         # Show changes to be deployed

# Real AWS commands (for production)
npx cdk bootstrap         # Setup CDK in AWS account (one time)
npx cdk deploy           # Deploy to AWS
npx cdk destroy          # Remove from AWS
npx cdk synth            # Generate CloudFormation template
```

**Important**: Always build your Lambda code (`npm run build`) before deploying CDK.

---

## 9. Environment Configuration

### Create Environment Files
```bash
# Development environment variables
cat > .env.development << 'EOF'
AWS_REGION=us-east-1
STAGE=dev
EOF

# Production environment variables (don't commit secrets!)
cat > .env.production << 'EOF'
AWS_REGION=us-east-1
STAGE=prod
EOF

# Add to .gitignore
echo ".env*" >> .gitignore
```
**Why**: Separates configuration from code. Never commit secrets - use AWS Secrets Manager or Parameter Store.

---

## 7. Documentation Setup

### Create README
```bash
cat > README.md << 'EOF'
# Project Name

## Description
Brief description of the project

## Architecture
- Frontend: S3 + CloudFront
- Backend: API Gateway + Lambda
- Database: DynamoDB
- Auth: Cognito
- IaC: AWS CDK with TypeScript

## Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Configure AWS credentials
4. Deploy: `cdk deploy`

## Development
- Backend: `cd backend && npm run watch`
- Frontend: `cd frontend && npm start`
- Infrastructure: `cd infrastructure && cdk diff`

## Testing
- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
EOF
```
**Why**: Documentation is crucial for team collaboration and future maintenance.

---

## 8. Git Configuration

### Initialize Git and First Commit
```bash
# Create comprehensive .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*.log

# Build outputs
dist/
build/
*.js
*.d.ts
*.js.map
!jest.config.js

# CDK
*.swp
.cdk.staging
cdk.out

# Environment
.env*
!.env.example

# IDE
.vscode/
.idea/

# OS
.DS_Store
EOF

# Initial commit
git add .
git commit -m "Initial project setup with CDK and TypeScript"
```
**Why**: Proper .gitignore prevents committing sensitive data and unnecessary files.

---

## Common Commands Reference

### CDK Commands
```bash
cdk init          # Initialize new CDK project
cdk list          # List all stacks
cdk diff          # Show changes to be deployed
cdk deploy        # Deploy stack to AWS
cdk destroy       # Remove stack from AWS
cdk synth         # Generate CloudFormation template
```

### Development Commands
```bash
npm run build     # Compile TypeScript
npm run watch     # Watch mode for development
npm test          # Run tests
npm run lint      # Check code quality
```

---

## Next Steps After Setup
1. [ ] Create first Lambda function
2. [ ] Define CDK stack for resources
3. [ ] Set up Cognito user pool
4. [ ] Configure API Gateway
5. [ ] Add DynamoDB table
6. [ ] Deploy to AWS
7. [ ] Set up monitoring with CloudWatch

---

## Tips
- Always use TypeScript for type safety
- Keep Lambda functions small and focused
- Use environment variables for configuration
- Tag all AWS resources for cost tracking
- Set up alerts for errors and throttling
- Use structured logging (JSON format)
- Implement proper error handling
- Follow least privilege principle for IAM

---

## Troubleshooting
- **CDK Bootstrap Error**: Check AWS credentials and region
- **TypeScript Errors**: Verify tsconfig.json and installed types
- **Lambda Timeout**: Increase timeout in CDK stack (default 3s)
- **CORS Issues**: Configure CORS in API Gateway