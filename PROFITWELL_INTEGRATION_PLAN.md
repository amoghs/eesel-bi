# Profitwell Integration Plan - eesel AI BI Dashboard

## Overview
This document outlines the plan for integrating Profitwell API into the eesel AI BI dashboard to display MRR metrics, customer data, and churn information.

## API Information
- **Base URL**: `https://api.profitwell.com/`
- **Documentation**: https://profitwellapiv2.docs.apiary.io/
- **Authentication**: API Key based (will need to be configured via environment variables)

## Key Metrics to Display

### 1. MRR and Growth Metrics
**Dashboard Requirement**: Current MRR and growth split by:
- Retained Revenue
- Upgrades (Expansion)  
- Resurrected Revenue
- Churn

**Profitwell API Endpoints**:
- `/v2/metrics/` - Monthly financial metrics with filtering options
- `/v2/metrics/mrr` - Specific MRR data
- `/v2/metrics/churn` - Churn metrics
- `/v2/metrics/expansion` - Expansion revenue metrics

### 2. Recent Customers
**Dashboard Requirement**: Most recent customers

**Profitwell API Endpoints**:
- `/v2/companies/{company_id}/users` - Customer data
- Recent signups can be filtered by date ranges

### 3. Recent Churn
**Dashboard Requirement**: Most recent churn events

**Profitwell API Endpoints**:
- `/v2/metrics/churn` - Churn data with temporal filtering
- `/v2/companies/{company_id}/users/{user_id}/subscriptions` - Individual subscription history

## Data Models

### MRR Metrics Model
```typescript
interface MRRMetrics {
  month: string;
  newMRR: number;
  expansionMRR: number;  // Upgrades
  retainedMRR: number;
  churnMRR: number;
  resurrectMRR: number;
  netMRR: number;
}
```

### Customer Model
```typescript
interface Customer {
  id: string;
  email: string;
  signupDate: string;
  currentMRR: number;
  planId: string;
  status: 'active' | 'churned' | 'paused';
}
```

### Churn Event Model
```typescript
interface ChurnEvent {
  customerId: string;
  customerEmail: string;
  churnDate: string;
  churnReason: string;
  lostMRR: number;
  planId: string;
}
```

## Implementation Strategy

### Phase 1: API Client Setup
1. Create Profitwell API client with proper error handling
2. Implement authentication using API keys
3. Add rate limiting and retry logic
4. Create type-safe interfaces for all API responses

### Phase 2: Data Fetching Layer
1. Implement data fetching functions for each metric type
2. Add caching layer using React Query or SWR
3. Create data transformation utilities to match our display models
4. Implement error boundaries and fallback states

### Phase 3: Dashboard Components
1. MRR Growth Chart (using ShadCN Charts)
   - Area chart showing MRR breakdown by category
   - Monthly comparison view
   - Growth rate indicators

2. Recent Customers Table
   - Sortable table with customer details
   - Filter by date range
   - Export functionality

3. Recent Churn Table
   - Churn events with reasons
   - Lost revenue impact
   - Date filtering

### Phase 4: Data Aggregation
Since we need to combine Profitwell + Atlassian data:
1. Create aggregation service that combines both data sources
2. Normalize data structures from both APIs
3. Handle discrepancies and data quality issues
4. Provide unified metrics interface

## Technical Architecture

### File Structure
```
/src
  /lib
    /profitwell
      - client.ts          # API client
      - types.ts           # TypeScript interfaces
      - utils.ts           # Data transformation utilities
  /components
    /dashboard
      - MRRChart.tsx       # MRR visualization
      - CustomersTable.tsx # Recent customers
      - ChurnTable.tsx     # Recent churn
  /hooks
    - useMRRData.ts        # React Query hooks
    - useCustomers.ts
    - useChurnData.ts
  /pages/api
    - profitwell/         # Next.js API routes for server-side calls
```

### Environment Variables Required
```env
PROFITWELL_API_KEY=your_api_key_here
PROFITWELL_COMPANY_ID=your_company_id
```

## Data Refresh Strategy
1. **Real-time**: Customer events, recent signups
2. **Hourly**: Current MRR, active subscriptions
3. **Daily**: Historical metrics, churn analysis
4. **Manual**: On-demand refresh for specific date ranges

## Error Handling Strategy
1. Graceful degradation when API is unavailable
2. Cached data fallbacks
3. User-friendly error messages
4. Retry mechanisms with exponential backoff
5. Monitoring and alerting for API failures

## Testing Strategy
1. Unit tests for API client and data transformations
2. Integration tests for dashboard components
3. Mock API responses for development and testing
4. End-to-end testing for critical user flows

## Performance Considerations
1. Implement proper caching at multiple levels
2. Lazy loading for dashboard components
3. Pagination for large datasets
4. Optimized queries to reduce API calls
5. Background data fetching for better UX

## Security Considerations
1. API keys stored securely in environment variables
2. Server-side API calls to avoid exposing credentials
3. Input validation for all user inputs
4. CORS configuration for API endpoints

## Future Enhancements
1. Historical trend analysis
2. Predictive churn modeling
3. Customer segmentation views
4. Automated alerting for metric thresholds
5. Export capabilities for all data views