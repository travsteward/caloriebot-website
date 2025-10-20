# CalorieBot GA4 Event Tracking Implementation Guide

## Overview
This document outlines the Google Analytics 4 (GA4) event tracking implementation for the CalorieBot website. GA4 tracking is critical for understanding user behavior, conversion rates, and revenue model preferences across our dual business model (Make Money Server vs Private Coaching Server).

## GA4 Property Setup
- **Measurement ID**: `G-8SD2BXG767`
- **Property Name**: CalorieBot Website
- **Enhanced Measurement**: Enabled
- **Cross-domain tracking**: Not required (single domain)

## Core Business Objectives
1. **Track Revenue Model Interest**: Understand which pricing model (affiliate commissions vs coaching seats) appeals to users
2. **Monitor Conversion Funnels**: Track Discord bot additions and affiliate signups
3. **Measure Content Engagement**: Blog posts, feature interactions, and user guides
4. **Optimize User Journey**: Identify how users discover pricing and navigate between models

## Event Tracking Implementation

### 1. Revenue Model Discovery & Interest
**Event Name**: `pricing_model_interest`
**Purpose**: Track which pricing model users show interest in
**Trigger**: Click on quick nav buttons or section links
```javascript
gtag('event', 'pricing_model_interest', {
  model_type: 'make_money_server' | 'private_coaching_server',
  source: 'quick_nav' | 'section_scroll' | 'direct_link',
  page_location: window.location.href
});
```

### 2. Discord Bot Integration (Primary Conversion)
**Event Name**: `discord_oauth_start`
**Purpose**: Track when users initiate Discord OAuth flow
**Trigger**: Click on "Add to Discord" buttons
```javascript
gtag('event', 'discord_oauth_start', {
  page_location: window.location.href,
  intended_action: 'bot_addition' | 'server_setup',
  referrer: document.referrer
});
```

**Event Name**: `bot_added_to_server`
**Purpose**: Track successful bot installations
**Trigger**: Successful Discord OAuth callback
```javascript
gtag('event', 'bot_added_to_server', {
  server_type: 'affiliate' | 'private' | 'personal',
  user_count: 'small' | 'medium' | 'large', // estimated
  setup_intent: 'make_money' | 'coaching' | 'personal_use'
});
```

### 3. Affiliate Program Engagement
**Event Name**: `affiliate_signup_start`
**Purpose**: Track affiliate account creation starts
**Trigger**: Click on affiliate signup buttons
```javascript
gtag('event', 'affiliate_signup_start', {
  source: 'pricing_page' | 'affiliate_page' | 'for_creators_page',
  page_location: window.location.href
});
```

**Event Name**: `stripe_connection_attempt`
**Purpose**: Track Stripe account linking attempts
**Trigger**: Stripe Connect OAuth start
```javascript
gtag('event', 'stripe_connection_attempt', {
  page: 'affiliate_setup' | 'pricing_page',
  connection_type: 'stripe_connect'
});
```

### 4. Content & Feature Engagement
**Event Name**: `feature_interaction`
**Purpose**: Track engagement with feature sections
**Trigger**: Clicks on feature CTAs or demos
```javascript
gtag('event', 'feature_interaction', {
  feature_name: 'AI Photo Tracking' | 'Workout Generator' | 'Nutrition Tracker' | 'Group Coaching',
  interaction_type: 'learn_more_click' | 'demo_view' | 'video_play',
  page_location: window.location.href
});
```

**Event Name**: `blog_post_engagement`
**Purpose**: Track blog content performance
**Trigger**: Blog post views and interactions
```javascript
gtag('event', 'blog_post_engagement', {
  post_title: 'AI Photo Calorie Tracking Future',
  post_category: 'features' | 'monetization' | 'community',
  engagement_type: 'page_view' | 'read_complete' | 'share' | 'link_click',
  time_on_page: 120
});
```

### 5. Navigation & User Journey
**Event Name**: `section_navigation`
**Purpose**: Track how users navigate between pricing sections
**Trigger**: Scroll to sections or click quick nav
```javascript
gtag('event', 'section_navigation', {
  from_section: 'hero' | 'make_money_server' | 'private_coaching',
  to_section: 'make_money_server' | 'private_coaching',
  navigation_method: 'quick_nav_click' | 'scroll' | 'anchor_link',
  scroll_depth: 75
});
```

**Event Name**: `pricing_discovery`
**Purpose**: Track how users find pricing information
**Trigger**: Pricing page views with referrer tracking
```javascript
gtag('event', 'pricing_discovery', {
  discovery_method: 'main_nav_affiliate' | 'footer_pricing' | 'direct_url' | 'blog_link',
  referrer: document.referrer,
  campaign_source: 'organic' | 'social' | 'paid' | 'referral'
});
```

### 6. Lead Generation & Contact
**Event Name**: `contact_form_submit`
**Purpose**: Track contact form submissions
**Trigger**: Successful form submissions
```javascript
gtag('event', 'contact_form_submit', {
  form_type: 'general_inquiry' | 'support' | 'partnership' | 'demo_request',
  page_location: window.location.href,
  form_completion_time: 45 // seconds
});
```

### 7. Purchase & Subscription Events
**Event Name**: `subscription_start`
**Purpose**: Track personal subscription starts
**Trigger**: Stripe checkout initiation for personal plans
```javascript
gtag('event', 'subscription_start', {
  plan_type: 'personal_monthly' | 'personal_yearly',
  price: 19.99,
  currency: 'USD'
});
```

**Event Name**: `seat_purchase`
**Purpose**: Track coaching seat purchases
**Trigger**: Seat purchase completion
```javascript
gtag('event', 'seat_purchase', {
  seat_count: 25,
  total_cost: 320,
  currency: 'USD',
  coach_server_id: 'server_123'
});
```

## Implementation Priority & Rollout Plan

### Phase 1: Core Business Metrics (Week 1)
1. ✅ GA4 base tracking (already implemented)
2. `pricing_model_interest` - Revenue model preference tracking
3. `discord_oauth_start` - Primary conversion funnel start
4. `section_navigation` - User journey mapping

### Phase 2: Conversion Tracking (Week 2)
1. `bot_added_to_server` - Primary conversion completion
2. `affiliate_signup_start` - Affiliate funnel tracking
3. `stripe_connection_attempt` - Payment integration tracking

### Phase 3: Engagement & Optimization (Week 3)
1. `feature_interaction` - Content engagement
2. `blog_post_engagement` - Content performance
3. `contact_form_submit` - Lead generation

### Phase 4: Advanced Analytics (Week 4)
1. `subscription_start` - Revenue tracking
2. `seat_purchase` - Coaching business metrics
3. Custom audiences and remarketing setup

## Key Performance Indicators (KPIs)

### Primary KPIs
- **Bot Addition Rate**: `bot_added_to_server` events / `discord_oauth_start` events
- **Revenue Model Split**: % of users interested in Make Money vs Private Coaching
- **Affiliate Signup Rate**: `affiliate_signup_start` / pricing page visits

### Secondary KPIs
- **Pricing Discovery Source**: How users find pricing (nav vs footer vs direct)
- **Feature Engagement**: Which features drive the most interest
- **Content Performance**: Blog posts with highest engagement

### Attribution & Conversion Windows
- **Primary Conversion**: Bot addition (7-day attribution window)
- **Secondary Conversion**: Affiliate signup (14-day attribution window)
- **Revenue Attribution**: 30-day view-through attribution

## Custom Dimensions & Metrics

### Custom Dimensions
- `revenue_model_preference` - User's preferred business model
- `server_setup_intent` - Why they're adding the bot
- `pricing_discovery_method` - How they found pricing

### Custom Metrics
- `total_seats_purchased` - For coaching model tracking
- `commission_earnings` - Affiliate earnings tracking
- `feature_interaction_score` - Engagement scoring

## Privacy & Compliance
- **GDPR Compliance**: Respect user consent preferences
- **Data Retention**: 26 months (GA4 default)
- **PII Handling**: No personally identifiable information tracked
- **Cross-device Tracking**: Enabled for user journey mapping

## Testing & Validation

### Pre-deployment Checklist
- [ ] All events fire correctly in GA4 DebugView
- [ ] Event parameters are populated correctly
- [ ] No console errors in browser dev tools
- [ ] Events work across all major browsers
- [ ] Mobile responsiveness verified

### Post-deployment Validation
- [ ] Real-time events appear in GA4 dashboard
- [ ] Conversion goals trigger correctly
- [ ] Custom reports show expected data
- [ ] Attribution models working as expected

## Maintenance & Updates
- **Monthly Review**: Analyze event performance and conversion rates
- **Quarterly Updates**: Add new events based on user behavior insights
- **Annual Audit**: Ensure compliance with latest privacy regulations
- **Performance Monitoring**: Watch for tracking script impact on page speed

## Troubleshooting

### Common Issues
- **Events not firing**: Check GA4 configuration and script loading
- **Parameters missing**: Verify parameter names match GA4 schema
- **Attribution issues**: Check conversion window settings
- **Cross-domain tracking**: Ensure measurement ID is consistent

### Debug Tools
- **GA4 DebugView**: Real-time event validation
- **Browser DevTools**: Console logging and network inspection
- **GA4 Realtime Reports**: Immediate validation of events
- **Tag Assistant**: Chrome extension for GA4 debugging

## Resources
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [GA4 Custom Events Guide](https://support.google.com/analytics/answer/10085872)
- [Stripe Connect GA4 Tracking](https://stripe.com/docs/connect/analytics)
- [Discord OAuth Analytics](https://discord.com/developers/docs/topics/oauth2)
