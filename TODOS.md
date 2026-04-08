# 📋 Language Coach - TODO List

This file tracks all known tasks, improvements, and technical debt for the Language Coach application.

## 🔥 Critical (Must Fix Before Production) 🔴

### TODO-001: Add Production Monitoring and Logging
**Status:** ❌ Not Started  
**Priority:** Critical  
**Estimate:** 3-5 days  
**Owner:** [Unassigned]  

**Description:**
Implement comprehensive monitoring and logging for production deployment:
- Cloud Monitoring for metrics and dashboards
- Cloud Logging for structured logs
- Error Reporting for exception tracking
- SLOs and alerts for critical paths
- **Terraform provisioning** for monitoring resources

**Why:**
Essential for production operations, troubleshooting, and compliance. Currently blind to production issues.

**Acceptance Criteria:**
- [ ] Cloud Monitoring dashboard showing key metrics (latency, error rates, throughput)
- [ ] Structured logging with trace IDs for request correlation
- [ ] Error reporting with automatic notifications for critical failures
- [ ] SLOs defined for API availability and response times
- [ ] Alerts configured for error budget violations
- [ ] **Terraform files updated** (`monitoring.tf`, `alerts.tf`)
- [ ] Monitoring APIs enabled in Terraform
- [ ] Service accounts with monitoring permissions in Terraform

**Dependencies:**
- GCP project with monitoring API enabled
- Service account with monitoring permissions

**Terraform Files to Create/Update:**
- `deployment/terraform/monitoring.tf` - Cloud Monitoring resources
- `deployment/terraform/alerts.tf` - Alert policies
- `deployment/terraform/apis.tf` - Add monitoring APIs
- `deployment/terraform/iam.tf` - Add monitoring permissions

**Resources:**
- https://cloud.google.com/monitoring
- https://cloud.google.com/logging
- https://cloud.google.com/error-reporting
- https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/monitoring_alert_policy

---

### TODO-002: Implement Secrets Management
**Status:** ❌ Not Started  
**Priority:** Critical  
**Estimate:** 2-3 days  
**Owner:** [Unassigned]  

**Description:**
Migrate all secrets (API keys, database credentials, service account keys) from environment variables to Google Secret Manager. Includes Terraform provisioning for Secret Manager resources.

**Why:**
Security best practice. Prevents accidental exposure, enables rotation, and provides access control.

**Acceptance Criteria:**
- [ ] All secrets migrated to Secret Manager
- [ ] Application code updated to fetch secrets from Secret Manager
- [ ] IAM policies configured for least-privilege access
- [ ] Documentation updated with secret management procedures
- [ ] CI/CD pipelines updated to use Secret Manager
- [ ] **Terraform files updated** (`secrets.tf`, `iam.tf`)
- [ ] Secret Manager API enabled in Terraform
- [ ] Secrets provisioned via Terraform
- [ ] IAM bindings for secret access in Terraform

**Dependencies:**
- Google Secret Manager API enabled
- Appropriate IAM permissions

**Terraform Files to Create/Update:**
- `deployment/terraform/secrets.tf` - Secret Manager resources and secrets
- `deployment/terraform/iam.tf` - IAM bindings for secret access
- `deployment/terraform/apis.tf` - Enable Secret Manager API
- `deployment/terraform/variables.tf` - Add secret variables

**Resources:**
- https://cloud.google.com/secret-manager
- https://cloud.google.com/iam/docs/understanding-roles
- https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/secret_manager_secret
- https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/secret_manager_secret_version

---

### TODO-003: Expand Authentication Test Coverage
**Status:** ❌ Not Started  
**Priority:** Critical  
**Estimate:** 3-4 days  
**Owner:** [Unassigned]  

**Description:**
Add comprehensive test coverage for authentication flows. Currently only 6 basic tests exist.

**Missing Test Coverage:**
- Password reset flow (request, token validation, completion)
- Email verification
- Token expiration and refresh
- Concurrent sessions
- Session revocation
- Social login (if applicable)
- Rate limiting
- Brute force protection

**Acceptance Criteria:**
- [ ] Password reset tests (happy path + error cases)
- [ ] Email verification tests
- [ ] Token expiration and refresh tests
- [ ] Concurrent session handling tests
- [ ] Rate limiting tests
- [ ] Test coverage >= 90% for auth endpoints
- [ ] All tests pass in CI pipeline

**Dependencies:**
- Test framework (pytest)
- Firestore emulator for integration tests
- Auth emulator for token tests

**Resources:**
- https://firebase.google.com/docs/auth
- https://pytest.org

---

### TODO-004: Add Rate Limiting to Auth Endpoints
**Status:** ❌ Not Started  
**Priority:** Critical  
**Estimate:** 1-2 days  
**Owner:** [Unassigned]  

**Description:**
Implement rate limiting on authentication endpoints to prevent brute force attacks.

**Endpoints to Protect:**
- `/api/auth/register`
- `/api/auth/login` (if separate from Firebase)
- `/api/auth/forgot-password`
- Any custom auth endpoints

**Acceptance Criteria:**
- [ ] Rate limiting middleware implemented
- [ ] Configurable limits (e.g., 10 attempts per minute per IP)
- [ ] Appropriate HTTP 429 responses
- [ ] Logging of rate limit events
- [ ] Tests for rate limiting behavior

**Dependencies:**
- FastAPI rate limiting library (e.g., `slowapi`)
- Redis or alternative storage for rate limit tracking

**Resources:**
- https://fastapi.tiangolo.com/advanced/rate-limiting/
- https://github.com/laurentS/slowapi

---

### TODO-005: Implement Security Headers and CORS
**Status:** ❌ Not Started  
**Priority:** Critical  
**Estimate:** 1-2 days  
**Owner:** [Unassigned]  

**Description:**
Add proper security headers and tighten CORS configuration for production.

**Security Headers Needed:**
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy

**CORS Configuration:**
- Tighten from wildcard to specific allowed origins
- Configure allowed methods and headers
- Add preflight cache

**Acceptance Criteria:**
- [ ] Security middleware implemented
- [ ] All security headers configured with sensible defaults
- [ ] CORS restricted to known domains
- [ ] Tests for security headers
- [ ] Documentation of security header policies

**Dependencies:**
- FastAPI security middleware
- List of allowed domains

**Resources:**
- https://owasp.org/www-project-secure-headers/
- https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

---

### TODO-006: Configure Production Firestore Database
**Status:** ❌ Not Started  
**Priority:** Critical  
**Estimate:** 2-3 days  
**Owner:** [Unassigned]  

**Description:**
Configure production Firestore database with proper settings and Terraform provisioning. Currently only emulator is configured for DEV mode.

**Requirements:**
- Production Firestore database with Native mode
- Appropriate location and retention policies
- Security rules and IAM bindings
- Backup and restore configuration
- Monitoring and alerting integration

**Acceptance Criteria:**
- [ ] Production Firestore database provisioned via Terraform
- [ ] Security rules configured for production
- [ ] IAM bindings for least-privilege access
- [ ] Backup policy configured
- [ ] Monitoring alerts for database metrics
- [ ] **Terraform files updated** (`firestore.tf`, `firestore_prod.tf`)
- [ ] Documentation for database management

**Dependencies:**
- GCP project with Firestore API enabled
- Appropriate service accounts and permissions

**Terraform Files to Create/Update:**
- `deployment/terraform/firestore_prod.tf` - Production Firestore configuration
- `deployment/terraform/firestore_backup.tf` - Backup policies
- `deployment/terraform/iam.tf` - Firestore IAM bindings
- `deployment/terraform/monitoring.tf` - Firestore monitoring
- `deployment/terraform/variables.tf` - Add production Firestore variables

**Resources:**
- https://cloud.google.com/firestore/docs
- https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/firestore_database
- https://cloud.google.com/firestore/docs/security/iam

---

### TODO-007: Add Health Check Endpoint
**Status:** ❌ Not Started  
**Priority:** Critical  
**Estimate:** 1 day  
**Owner:** [Unassigned]  

**Description:**
Add `/api/health` endpoint for monitoring application health and dependencies.

**Endpoint Requirements:**
- GET `/api/health`
- Returns 200 OK with system status
- Checks database connectivity
- Checks external service dependencies
- Minimal performance impact

**Acceptance Criteria:**
- [ ] Health check endpoint implemented
- [ ] Returns database status
- [ ] Returns external service status
- [ ] Configurable timeout
- [ ] Proper caching headers
- [ ] Integration with monitoring systems

**Dependencies:**
- Database connection pool
- External service clients

**Resources:**
- https://tools.ietf.org/html/rfc7231#section-6.3.5
- https://cloud.google.com/monitoring/api/metrics#gcp-health-checks

---

## 🟡 High Priority (Should Fix Before Production)

### TODO-010: Implement Caching Layer
**Status:** ✅ Completed  
**Priority:** High  
**Estimate:** 2-3 days  
**Owner:** Oz  

**Description:**
Add Redis/Memorystore caching layer for frequent queries and API responses. Includes Terraform provisioning for caching infrastructure.

**Cache Targets:**
- API response caching
- Database query results
- Session data
- Rate limiting counters
- Expensive computations

**Acceptance Criteria:**
- [ ] Redis/Memorystore instance configured via Terraform
- [ ] Caching middleware implemented
- [ ] Cache invalidation strategy
- [ ] Configurable TTLs
- [ ] Cache hit/miss metrics
- [ ] Tests for caching behavior
- [ ] **Terraform files updated** (`redis.tf`, `outputs.tf`)

**Dependencies:**
- Redis/Memorystore instance
- Caching library (e.g., `redis-py`)

**Terraform Files to Create/Update:**
- `deployment/terraform/redis.tf` - Redis/Memorystore instance and configuration
- `deployment/terraform/iam.tf` - IAM permissions for Redis access
- `deployment/terraform/apis.tf` - Enable Redis API
- `deployment/terraform/outputs.tf` - Export Redis connection details
- `deployment/terraform/variables.tf` - Add Redis variables

**Resources:**
- https://redis.io
- https://cloud.google.com/memorystore
- https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/redis_instance

---

### TODO-011: Add Frontend Testing
**Status:** ✅ Completed  
**Priority:** High  
**Estimate:** 5-7 days  
**Owner:** Oz  

**Description:**
Add comprehensive frontend testing with Playwright or Cypress.

**Test Types Needed:**
- Component tests (individual components)
- Integration tests (component interactions)
- E2E tests (complete user flows)
- Accessibility tests
- Visual regression tests

**Acceptance Criteria:**
- [ ] Component test suite (Vitest/Jest)
- [ ] E2E test suite (Playwright/Cypress)
- [ ] CI integration for frontend tests
- [ ] Accessibility test coverage
- [ ] Test coverage >= 80%
- [ ] All critical user flows tested

**Dependencies:**
- Testing framework (Playwright/Cypress)
- Test runner configuration
- CI pipeline integration

**Resources:**
- https://playwright.dev
- https://www.cypress.io
- https://www.w3.org/WAI/standards-guidelines/

---

### TODO-012: Fix N+1 Query Patterns
**Status:** ✅ Completed  
**Priority:** High  
**Estimate:** 2-3 days  
**Owner:** Oz  

**Description:**
Identify and fix N+1 query patterns in database access, particularly in course/lesson loading.

**Common Patterns:**
- Loading course with all lessons
- Loading user with all progress
- Loading language with all courses

**Acceptance Criteria:**
- [ ] N+1 queries identified and documented
- [ ] Batch loading implemented where needed
- [ ] DataLoader pattern for GraphQL-like batching
- [ ] Performance tests showing improvement
- [ ] No N+1 queries in critical paths

**Dependencies:**
- Database query analysis tools
- Performance testing framework

**Resources:**
- https://www.prisma.io/dataguide/types/relational/what-are-n-plus-1-queries
- https://dataloader.github.io/

---

### TODO-013: Implement Canary Deployments
**Status:** ✅ Completed  
**Priority:** High  
**Estimate:** 2-3 days  
**Owner:** Oz  

**Description:**
Add canary deployment strategy to Cloud Build pipelines for safer production rollouts.

**Canary Strategy:**
- Deploy to small percentage of traffic first
- Monitor metrics and error rates
- Gradual rollout to 100%
- Automatic rollback on failures

**Acceptance Criteria:**
- [ ] Canary deployment configuration in Cloud Build
- [ ] Traffic splitting mechanism
- [ ] Monitoring integration for canary metrics
- [ ] Automatic rollback on failure
- [ ] Documentation of canary process
- [ ] Tests for canary deployment behavior

**Dependencies:**
- Cloud Build configuration
- Monitoring integration
- Traffic management (Cloud Run revisions)

**Resources:**
- https://cloud.google.com/run/docs/rolling-out-revisions
- https://cloud.google.com/build/docs/deploying-builds/deploy-cloud-run

---

### TODO-014: Configure WAF and CDN
**Status:** ✅ Completed  
**Priority:** High  
**Estimate:** 2-3 days  
**Owner:** Oz  

**Description:**
Add Web Application Firewall (WAF) and CDN configuration for production. Includes Terraform provisioning for security and performance infrastructure.

**Requirements:**
- Cloud Armor WAF with security policies
- Cloud CDN for frontend assets
- DDoS protection
- Cache invalidation strategy
- Security rules for common attacks (SQLi, XSS, etc.)

**Acceptance Criteria:**
- [ ] Cloud Armor security policy configured via Terraform
- [ ] WAF rules for common attack patterns
- [ ] Cloud CDN configured for frontend assets
- [ ] DDoS protection enabled
- [ ] Cache configuration for optimal performance
- [ ] **Terraform files updated** (`waf.tf`, `cdn.tf`)
- [ ] Monitoring for WAF events
- [ ] Documentation for WAF/CDN management

**Dependencies:**
- GCP project with Cloud Armor and CDN APIs enabled
- Appropriate service accounts and permissions

**Terraform Files to Create/Update:**
- `deployment/terraform/waf.tf` - Cloud Armor WAF configuration
- `deployment/terraform/cdn.tf` - Cloud CDN configuration
- `deployment/terraform/iam.tf` - WAF/CDN IAM bindings
- `deployment/terraform/monitoring.tf` - WAF monitoring
- `deployment/terraform/apis.tf` - Enable WAF and CDN APIs
- `deployment/terraform/variables.tf` - Add WAF/CDN variables

**Resources:**
- https://cloud.google.com/armor
- https://cloud.google.com/cdn
- https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_security_policy
- https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cdn

---

## 🟢 Medium Priority (Nice to Have)

### TODO-020: Add DEV_FIRESTORE_PROJECT_ID Option
**Status:** ✅ Completed  
**Priority:** Medium  
**Estimate:** 1 day  
**Owner:** Oz  

**Description:**
Add configuration option to use real Firestore dev database instead of emulator in DEV mode.

**Acceptance Criteria:**
- [ ] DEV_FIRESTORE_PROJECT_ID environment variable support
- [ ] Configuration to switch between emulator and real database
- [ ] Documentation updated
- [ ] No breaking changes to existing emulator workflow

**Dependencies:**
- Firestore dev project setup
- Appropriate IAM permissions

---

### TODO-021: Add Docker Compose for Production-like Testing
**Status:** ✅ Completed  
**Priority:** Medium  
**Estimate:** 2-3 days  
**Owner:** Oz  

**Description:**
Create docker-compose setup for local production-like testing environment.

**Services to Include:**
- Backend (FastAPI)
- Frontend (Vite)
- Firestore emulator
- Auth emulator
- Redis (for caching)
- (Optional) PostgreSQL

**Acceptance Criteria:**
- [ ] docker-compose.yml file
- [ ] All services configurable via .env
- [ ] Documentation for local prod testing
- [ ] Health checks for all services
- [ ] Example configuration files

**Dependencies:**
- Docker and docker-compose installed
- Service container images

**Resources:**
- https://docs.docker.com/compose/
- https://github.com/firebase/firebase-tools/tree/master/emulator

---

### TODO-022: Add Error Boundaries to Frontend
**Status:** ✅ Completed  
**Priority:** Medium  
**Estimate:** 1-2 days  
**Owner:** Oz  

**Description:**
Add React error boundaries to prevent UI crashes from component errors.

**Error Boundary Locations:**
- Route level (catch errors in page components)
- Feature level (catch errors in major features)
- App level (catch uncaught errors)

**Acceptance Criteria:**
- [ ] Error boundary components created
- [ ] Error boundaries added at appropriate levels
- [ ] Error logging to monitoring systems
- [ ] User-friendly error messages
- [ ] Recovery mechanisms where possible
- [ ] Tests for error boundary behavior

**Dependencies:**
- Error monitoring integration
- Error reporting service

**Resources:**
- https://reactjs.org/docs/error-boundaries.html
- https://sentry.io/for/react/

---

### TODO-023: Expand Documentation
**Status:** ✅ Completed  
**Priority:** Medium  
**Estimate:** 3-5 days  
**Owner:** Oz  

**Description:**
Expand and improve documentation for onboarding and maintenance.

**Areas to Document:**
- Local development setup
- Testing strategies
- Deployment procedures
- Monitoring and troubleshooting
- Common issues and solutions
- Architecture decisions
- API documentation

**Acceptance Criteria:**
- [ ] Complete local setup guide
- [ ] Testing documentation
- [ ] Deployment runbook
- [ ] Troubleshooting guide
- [ ] Architecture decision records (ADRs)
- [ ] API documentation (Swagger/OpenAPI)

**Dependencies:**
- None (documentation only)

**Resources:**
- https://adrs.github.io/
- https://swagger.io/

---

## 📊 Task Statistics

**Total Tasks:** 16  
**Critical:** 8  
**High Priority:** 6  
**Medium Priority:** 4  

**Estimated Total Effort:** ~35-45 days  
**Critical Path:** ~12-18 days (monitoring, secrets, Firestore prod, auth testing, rate limiting, WAF/CDN)

## 📁 Terraform Files Summary

### Files That Need to Be Created:
- `deployment/terraform/monitoring.tf` - Cloud Monitoring resources and dashboards
- `deployment/terraform/alerts.tf` - Alert policies
- `deployment/terraform/secrets.tf` - Secret Manager resources
- `deployment/terraform/redis.tf` - Redis/Memorystore configuration
- `deployment/terraform/waf.tf` - Cloud Armor WAF rules
- `deployment/terraform/cdn.tf` - Cloud CDN configuration
- `deployment/terraform/firestore_prod.tf` - Production Firestore
- `deployment/terraform/firestore_backup.tf` - Backup policies

### Files That Need to Be Updated:
- `deployment/terraform/apis.tf` - Add monitoring, secrets, Redis, WAF, CDN APIs
- `deployment/terraform/iam.tf` - Add IAM bindings for all new services
- `deployment/terraform/outputs.tf` - Export connection details for new services
- `deployment/terraform/variables.tf` - Add variables for all new services
- `deployment/terraform/locals.tf` - Add local variables as needed

### Existing Files (No Major Changes Needed):
- `deployment/terraform/providers.tf` - Provider configuration
- `deployment/terraform/service_accounts.tf` - Service accounts
- `deployment/terraform/build_triggers.tf` - Cloud Build triggers
- `deployment/terraform/storage.tf` - Storage buckets
- `deployment/terraform/telemetry.tf` - Telemetry/logging (already comprehensive)

## 🎯 Roadmap

### Phase 1: Production Readiness (3-4 weeks)
- TODO-001: Add Production Monitoring
- TODO-002: Implement Secrets Management  
- TODO-003: Expand Authentication Testing
- TODO-004: Add Rate Limiting
- TODO-005: Implement Security Headers
- TODO-006: Configure Production Firestore Database
- TODO-007: Add Health Check Endpoint
- TODO-014: Configure WAF and CDN

### Phase 2: Performance & Reliability (2-3 weeks)
- TODO-010: Implement Caching Layer
- TODO-011: Add Frontend Testing
- TODO-012: Fix N+1 Query Patterns
- TODO-013: Implement Canary Deployments

### Phase 3: Developer Experience (1-2 weeks)
- TODO-020: Add DEV_FIRESTORE_PROJECT_ID Option
- TODO-021: Add Docker Compose for Prod Testing
- TODO-022: Add Error Boundaries
- TODO-023: Expand Documentation

## 📝 Task Management

**Status Legend:**
- ❌ Not Started
- 🟡 In Progress
- ✅ Completed
- ⏳ Deferred

**Priority Legend:**
- 🔴 Critical (blocks production)
- 🟡 High (should do before production)
- 🟢 Medium (nice to have)
- 🔵 Low (backlog)

**Update Process:**
1. Update status when starting/finishing tasks
2. Add owner when assigning
3. Update estimates if they change significantly
4. Add new tasks as they're identified
5. Remove completed tasks or move to changelog

## 🔗 Related Documents

- [ARCHITECTURE_REVIEW.md](ARCHITECTURE_REVIEW.md) - Detailed architecture analysis
- [VIBE.md](VIBE.md) - Project overview and conventions
- [DESIGN.md](DESIGN.md) - Product design system (if exists)

---

*Last updated: 2026-04-08*
*Review cycle: Weekly on Fridays*
