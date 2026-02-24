# ServiceNow Queries Reference

All queries target the Infor ServiceNow instance via the ION API gateway:

```
https://mingle-ionapi.us2.prd3.inforcloudsuite.com/CONCIERGE_PRD/CustomerApi/spd/SN/api/now/table/
```

Authentication: OAuth2 Bearer token via the `Authorization` header.

---

## Tables Used

| Table | Description |
|-------|-------------|
| `x_igss2_customer_p_standard_case` | Primary support cases |
| `sn_customerservice_task` | Customer service tasks linked to cases |
| `sys_user` | ServiceNow user records |
| `customer_account` | Customer account master data |
| `u_m2m_jira_ticket` | Many-to-many link between cases and JIRA tickets |
| `u_m2m_x_igss2_cust_u_kb_templat` | Many-to-many link between cases and KB articles |
| `u_kb_template_patch_knowledge` | Knowledge base patch articles |

---

## 1. Case Queries (`x_igss2_customer_p_standard_case`)

### 1.1 Open Cases by User

Retrieve all non-closed cases currently assigned to a specific support engineer. Used to build per-person open case dashboards.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `main.go:790` |
| `sysparm_query` | `state!=3^assigned_to={sysid}` |
| `sysparm_fields` | `due_date, number, short_description, assigned_on, sys_created_on, closed_at, priority, action_status, state, u_status, assigned_to, assigned_to.sys_id, assigned_to.email, assigned_to.country, assignment_group, sold_product, sys_updated_on, account, active_escalation, sys_id, sys_updated_by, resolved_at, resolution_code, assigned_to.manager, case_action_summary.number, case_action_summary.sys_updated_on, assigned_to.sys_id, version, u_tenancy, time_worked, account.sys_id, account.number, u_rpt_resolvetime, account.u_attribute, active_escalation.assigned_to, entitlement, workaround_provided, workaround_date, case_action_summary.next_steps, case_action_summary.actions_taken, close_notes, product_line` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |

### 1.2 Open Cases by User (Lightweight)

Same purpose as 1.1 but with a smaller field set — no dot-walked relations for account or escalation details. Defined in `case/main.go`.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `case/main.go:61` |
| `assigned_to` | `{sysid}` |
| `sysparm_query` | `state!=3` |
| `sysparm_fields` | `due_date, resolution_code, assignment_group, number, short_description, assigned_on, sys_created_on, closed_at, priority, action_status, u_status, state, assigned_to, sold_product, sys_updated_on, assignment_group, account, active_escalation, sys_id, sys_updated_by, version, u_tenancy, assigned_to.manager, case_action_summary.number, case_action_summary.sys_updated, assigned_to.sys_id` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |

### 1.3 Open Cases by Assignment Group

Retrieve all non-closed cases for an entire assignment group (e.g. "LN Finance Support"). Powers the team-level open case view.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `main.go:1238` |
| `sysparm_query` | `state!=3^assignment_group={ag}` |
| `sysparm_fields` | *(GetAllFields — see 1.1)* |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |
| `sysparm_limit` | `500` |
| `sysparm_offset` | `0, 500, 1000, ...` *(paginated)* |

### 1.4 Open Cases by Assignment Group (Manager-Filtered)

Same as 1.3 but further filtered to only include cases where the assignee's manager is in a known list. Ensures only cases from managed teams are counted.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `main.go:1166` |
| `sysparm_query` | `state!=3^assignment_group={ag}^assigned_to.manager.nameIN{MANAGERS_LIST_PRIMARY}` |
| `sysparm_fields` | *(GetAllFields — see 1.1)* |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |
| `sysparm_limit` | `1000` |
| `sysparm_offset` | `0, 1000, 2000, ...` *(paginated)* |

### 1.5 Assigned Cases by User (Last 24 Hours)

Find cases newly assigned to a user since yesterday evening. Drives the daily assignment notification and tracking.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `main.go:928` |
| `sysparm_query` | `assigned_on>{yesterday 20:30:00}^assigned_to={sysid}` |
| `sysparm_fields` | `number, short_description, assigned_on, sys_created_on, closed_at, priority, action_status, state, u_status, assigned_to, assigned_to.email, assignment_group, sold_product, sys_updated_on, account, active_escalation, sys_id, sys_updated_by, resolved_at, resolution_code, assigned_to.manager, case_action_summary.number, case_action_summary.sys_updated_on, assigned_to.sys_id, version, u_tenancy, time_worked, account.sys_id, account.number, u_rpt_resolvetime, account.u_attribute, active_escalation.assigned_to` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |

### 1.6 Assigned Cases by User (Last 24 Hours, Lightweight)

Same purpose as 1.5 with a slightly different field set. Defined in `case/main.go`.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `case/main.go:75` |
| `assigned_to` | `{sysid}` |
| `sysparm_query` | `assigned_on>{yesterday 20:30:00}` |
| `sysparm_fields` | `due_date, resolution_code, assignment_group, number, short_description, assigned_on, sys_created_on, closed_at, priority, action_status, u_status, state, assigned_to, sold_product, sys_updated_on, assignment_group, account, active_escalation, sys_id, sys_updated_by, assigned_to.manager, case_action_summary.number, case_action_summary.sys_updated, assigned_to.sys_id, version, u_tenancy` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |

### 1.7 Assigned Cases by Assignment Group (Configurable Interval)

Retrieve recently assigned cases for an entire group within a dynamic time window. Used for assignment volume reporting.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `main.go:986` |
| `sysparm_query` | `assigned_on>{N days ago 20:30:00}^assignment_group={ag}` |
| `sysparm_fields` | *(GetAllFields — see 1.1)* |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |
| `sysparm_limit` | `1000` |
| `sysparm_offset` | `0, 1000, 2000, ...` *(paginated)* |

### 1.8 Assigned Cases by User (Past Week)

Week-over-week view of a user's new assignments. Used for historical assignment trend tracking.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `case/main.go:86` |
| `assigned_to` | `{sysid}` |
| `sysparm_query` | `assigned_on>{8 days ago 20:30:00}` |
| `sysparm_fields` | `due_date, resolution_code, assignment_group, number, short_description, assigned_on, sys_created_on, closed_at, priority, action_status, u_status, state, assigned_to, sold_product, sys_updated_on, assignment_group, account, active_escalation, sys_id, sys_updated_by, assigned_to.manager, case_action_summary.number, case_action_summary.sys_updated, assigned_to.sys_id` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |

### 1.9 Assigned Cases by Assignment Group (Past Week)

Same as 1.8 but aggregated at the assignment group level rather than individual user.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `main.go:1057` |
| `assignment_group` | `{ag}` |
| `sysparm_query` | `assigned_on>{8 days ago 20:30:00}` |
| `sysparm_fields` | *(GetAllFields — see 1.1)* |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |
| `sysparm_limit` | `1000` |
| `sysparm_offset` | `0, 1000, 2000, ...` *(paginated)* |

### 1.10 Closed/Resolved Cases by User

Retrieve cases closed (state 3) or resolved (state 6) in the last 2 months for a specific user. The `^NQ` creates an OR condition — matches either closed-with-close-date or resolved-with-resolve-date. Used for individual productivity metrics.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `case/main.go:97` |
| `assigned_to` | `{sysid}` |
| `sysparm_query` | `state=3^closed_at>{2 months ago}!resolved_at>{2 months ago}^NQstate=6^resolved_at>{2 months ago}` |
| `sysparm_fields` | `number, short_description, assigned_on, sys_created_on, closed_at, priority, action_status, state, u_status, assigned_to, assigned_to.email, assignment_group, sold_product, sys_updated_on, account, active_escalation, sys_id, sys_updated_by, resolved_at, resolution_code, assigned_to.manager, case_action_summary.number, case_action_summary.sys_updated_on, assigned_to.sys_id, version, u_tenancy, time_worked, account.sys_id, account.number, u_rpt_resolvetime, account.u_attribute, active_escalation.assigned_to` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |

### 1.11 Closed/Resolved Cases by Assignment Group

Cases in closed or resolved state for an entire assignment group over the last 2 months. Used for team closure rate reporting.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `main.go:1457` |
| `sysparm_query` | `stateIN3,6^resolved_at>{2 months ago}^assignment_group={ag}` |
| `sysparm_fields` | *(GetAllFields — see 1.1)* |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |
| `sysparm_limit` | `500` |
| `sysparm_offset` | `0, 500, 1000, ...` *(paginated)* |

### 1.12 Resolved Cases by Assignment Group (Date Range)

Resolution metrics — closed or resolved cases within a precise date window (3-month lookback from a given date). Used for SLA and resolution time analysis.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `case/main.go:29` |
| `assignment_group` | `{ag}` |
| `sysparm_query` | `state=3^resolved_atBETWEEN{startdate}@{enddate}^NQstate=6^resolved_atBETWEEN{startdate}@{enddate}` |
| `sysparm_fields` | `due_date, resolution_code, assignment_group, number, short_description, assigned_on, sys_created_on, closed_at, priority, action_status, u_status, state, assigned_to, sold_product, sys_updated_on, assignment_group, account, active_escalation, resolved_at` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |

### 1.13 All Cases by Assignment Group (6 Months)

Full case snapshot for a group over the last 6 months regardless of state. Used for volume trending and workload analysis.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `main.go:1310` |
| `sysparm_query` | `sys_created_on>{6 months ago}^assignment_group={ag}` |
| `sysparm_fields` | *(GetAllFields — see 1.1)* |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |
| `sysparm_limit` | `1000` |
| `sysparm_offset` | `0, 1000, 2000, ...` *(paginated)* |

### 1.14 Cases by Assignment Group (6 Months, Lightweight)

Similar to 1.13 but with a smaller field set (no dot-walked relations). Used where full case detail is not needed.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `case/main.go:19` |
| `sysparm_query` | `sys_created_on>{6 months ago}` + `assignment_group={ag}` |
| `sysparm_fields` | `due_date, resolution_code, number, short_description, assigned_on, sys_created_on, closed_at, priority, action_status, u_status, state, assigned_to, sold_product, sys_updated_on, sold_product, active_escalation, resolved_at, assignment_group, sys_id, active_escalation, sys_updated_by` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |

### 1.15 All LN Cases Since Fixed Date (International Team)

All LN-prefixed team cases since April 2025 filtered by a specific set of managers. Used for the international LN team performance report.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `case/main.go:24` |
| `sysparm_query` | `sys_created_on>=2025-04-01 00:00:00^assignment_group.nameSTARTSWITHLN^assigned_to.manager.nameIN{manager_list}` |
| `sysparm_fields` | `number, account, sys_id, priority, assigned_to, assigned_to.manager, state, u_status, contact, internal_contact, assignment_group, sys_created_on, sys_updated_on, active_escalation, u_rpt_resolvetime, resolved_at, version, u_tenancy, u_rpt_resolvetime, status, active_account_escalation, account, account.sys_id, resolution_code, time_worked` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |

---

## 2. Major / Priority Case Queries (`x_igss2_customer_p_standard_case`)

### 2.1 Major Cases — This Week

Priority 1 (Critical) and Priority 2 (High) cases created since the start of the current week, scoped to managed teams. Powers the weekly major case alert.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `majorcase.go:30` |
| `sysparm_query` | `sys_created_on>=javascript:gs.beginningOfThisWeek()^priority=2^ORpriority=1^assigned_to.manager.nameIN{MANAGERS_LIST_PRIMARY}` |
| `sysparm_fields` | *(GetAllFields — see 1.1)* |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |

### 2.2 Major Cases — Last 7 Days

Rolling 7-day window of high-priority cases. Used as a secondary view when the week boundary doesn't align well (e.g. Monday morning).

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `majorcase.go:71` |
| `sysparm_query` | `sys_created_on>=javascript:gs.daysAgoStart(7)^priority=2^ORpriority=1^assigned_to.manager.nameIN{MANAGERS_LIST_PRIMARY}` |
| `sysparm_fields` | *(GetAllFields — see 1.1)* |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |

### 2.3 Major Cases — Last 120 Days

Longer-horizon view of major cases (~4 months). Used for trend analysis and management reporting on critical case volume.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `majorcase.go:115` |
| `sysparm_query` | `sys_created_on>=javascript:gs.daysAgoStart(120)^priority=2^ORpriority=1^assigned_to.manager.nameIN{MANAGERS_LIST_PRIMARY}` |
| `sysparm_fields` | *(GetAllFields — see 1.1)* |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |

### 2.4 Escalated Cases — This Week

Cases with an active escalation that were updated this week. The `active_escalation!=` condition means the field is not empty (i.e. escalation exists). Used for the weekly escalation review.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `majorcase.go:158` |
| `sysparm_query` | `sys_updated_on>=javascript:gs.beginningOfThisWeek()^active_escalation!=^assigned_to.manager.nameIN{MANAGERS_LIST_ESCALATED}` |
| `sysparm_fields` | *(GetAllFields — see 1.1)* |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |

### 2.5 Maintenance Cases — LN Teams

All LN team cases created or resolved since April 2025. Supports the maintenance/patch tracking workflow for ERP LN product line.

| Parameter | Value |
|-----------|-------|
| **Table** | `x_igss2_customer_p_standard_case` |
| **File** | `majorcase.go:201` |
| `sysparm_query` | `sys_created_on>=2025-04-01 00:00:00^ORresolved_at>=2025-04-01 00:00:00^assignment_group.nameSTARTSWITHLN` |
| `sysparm_fields` | *(GetAllFields — see 1.1)* |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |
| `sysparm_limit` | `1000` |
| `sysparm_offset` | `0, 1000, 2000, ...` *(paginated)* |

---

## 3. Task Queries (`sn_customerservice_task`)

### 3.1 Open Tasks by User

Non-closed tasks assigned to a specific user. Tasks are child work items of cases.

| Parameter | Value |
|-----------|-------|
| **Table** | `sn_customerservice_task` |
| **File** | `case/main.go:70` |
| `assigned_to` | `{sysid}` |
| `sysparm_query` | `state!=3` |
| `sysparm_fields` | `number, parent, assigned_to, state, priority, account, short_description, assignment_group, sys_created_on, sys_updated_on, sys_updated_by, opened_at` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |

### 3.2 Open Tasks by Assignment Group

All open tasks for an assignment group. Used for team task backlog visibility.

| Parameter | Value |
|-----------|-------|
| **Table** | `sn_customerservice_task` |
| **File** | `main.go:838` |
| `assignment_group` | `{ag}` |
| `sysparm_query` | `state!=3` |
| `sysparm_fields` | `number, parent, short_description, opened_at, sys_created_on, sys_updated_by, state, priority, account, assigned_to, closed_at, priority, action_status, state, u_status, assigned_to, assigned_to.sys_id, assigned_to.email, assigned_to.country, assignment_group, sold_product, sys_updated_on, account, active_escalation, sys_id, sys_updated_by, resolved_at, resolution_code, assigned_to.manager, case_action_summary.number, case_action_summary.sys_updated_on, assigned_to.sys_id, version, u_tenancy, time_worked, account.sys_id, account.number, u_rpt_resolvetime, account.u_attribute, active_escalation.assigned_to, entitlement, workaround_provided, workaround_date, case_action_summary.next_steps, case_action_summary.actions_taken, close_notes` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_suppress_pagination_header` | `true` |

---

## 4. JIRA Link Queries (`u_m2m_jira_ticket`)

### 4.1 Cases Linked to JIRA Tickets

Retrieve all case-to-JIRA associations where a case exists and the JIRA project key matches one of ~30 tracked projects (LN, FT, M3*, MION, MFS, CLM, CPQ, etc.). Used to correlate support cases with development defects/features.

| Parameter | Value |
|-----------|-------|
| **Table** | `u_m2m_jira_ticket` |
| **File** | `case/main.go:10` |
| `sysparm_query` | `u_case_number!=^((u_jira_project_key=LN^OR(u_jira_project_key=FT^ORu_jira_project_key=M3SOR^ORu_jira_project_key=M3FIN^ORu_jira_project_key=M3CIT^ORu_jira_project_key=M3SLS^ORu_jira_project_key=M3MPM^ORu_jira_project_key=M3SC^ORu_jira_project_key=M3ACE^ORu_jira_project_key=MION^ORu_jira_project_key=M3FM^ORu_jira_project_key=MFS^ORu_jira_project_key=MDMP^ORu_jira_project_key=MADS^ORu_jira_project_key=SHUB^ORu_jira_project_key=MSWB^ORu_jira_project_key=CLM^ORu_jira_project_key=MIPW^ORu_jira_project_key=TSDEVSUP^ORu_jira_project_key=MUA^ORu_jira_project_key=UID^ORu_jira_project_key=MGLT^ORu_jira_project_key=LCLPH^ORu_jira_project_key=M3CPW^ORu_jira_project_key=M3PORTALS^ORu_jira_project_key=MEC^ORu_jira_project_key=M3FND^ORu_jira_project_key=MPWB^ORu_jira_project_key=M3SR^ORu_jira_project_key=CPQ^ORu_jira_project_key=M3HOME)` |
| `sysparm_fields` | `u_case_number, u_fix_urgency, u_support_owner, u_priority, u_case_number.priority, u_case_number.assignment_group, u_case_number.sys_created_on, u_case_number.active_escalation, u_case_number.state, u_case_number.u_status, state, u_jira_url, u_jira_issue_id, u_case_number.account, u_case_number.version, u_case_number.product_line, u_case_number.product, u_jira_resolution, hu_jira_resolution_status, priority` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_limit` | `1000` |
| `sysparm_offset` | `0, 1000, 2000, ...` *(paginated)* |

---

## 5. Knowledge Base Queries

### 5.1 KB Patch Articles (`u_kb_template_patch_knowledge`)

Find ERP LN knowledge articles that reference patch update URLs and have an expired or soon-to-expire `valid_to` date. These are candidates for automatic `valid_to` extension via the `kb_create_update` API.

| Parameter | Value |
|-----------|-------|
| **Table** | `u_kb_template_patch_knowledge` |
| **File** | `case/main.go:42` |
| `sysparm_query` | `base_version!=^(u_kb_noteLIKEhttps://support.infor.com/media/LN/updates/^ORu_kb_resolutionLIKEhttps://support.infor.com/media/LN/updates/)^valid_to<=2025-05-01^latest=true^ORDERBYASCvalid_to` |
| `sysparm_fields` | `sys_id, version, workflow_state, latest, published, base_version, text, short_description, valid_to` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_first_row` | `true` |
| `kb_knowledge_base` | `ERP LN` |

### 5.2 KB-to-Case Links (`u_m2m_x_igss2_cust_u_kb_templat`)

Retrieve all records where a KB article is linked to a case (non-empty KB reference). Used to track which cases have associated knowledge articles.

| Parameter | Value |
|-----------|-------|
| **Table** | `u_m2m_x_igss2_cust_u_kb_templat` |
| **File** | `jira.go:70` |
| `sysparm_query` | `u_kb_template_product_knowledge!=` |
| `sysparm_fields` | `u_x_igss2_customer_p_standard_case, u_kb_template_product_knowledge` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |
| `sysparm_limit` | `1000` |
| `sysparm_offset` | `0, 1000, 2000, ...` *(paginated)* |

---

## 6. User Query (`sys_user`)

### 6.1 User Lookup by Username

Resolve a login username to a ServiceNow sys_id and retrieve user profile data. Used during account initialization (`-i` flag) to populate the local database with user identifiers.

| Parameter | Value |
|-----------|-------|
| **Table** | `sys_user` |
| **File** | `case/main.go:56` |
| `sysparm_query` | `user_name={login}` |
| `sysparm_fields` | `manager, name, user_name, email, sys_id, first_name, last_name, employee_number, location.country` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_display_value` | `true` |

---

## 7. Customer Account Query (`customer_account`)

### 7.1 All Customer Accounts

Full dump of all customer accounts from ServiceNow. Used to refresh the local `SNCustomerDB` table so case data can be joined with customer metadata (region, country, portal ID).

| Parameter | Value |
|-----------|-------|
| **Table** | `customer_account` |
| **File** | `case/main.go:51` |
| `sysparm_fields` | `number, name, u_support_portal_id, country, sys_id, u_region_new` |
| `sysparm_exclude_reference_link` | `true` |
| `sysparm_limit` | `100000` |

---

## 8. Custom API Endpoints (Non-Table)

### 8.1 Case Info Lookup

Retrieve detailed case information including sold product via a custom Infor API endpoint. Used to fill in missing `sold_product` data on JIRA-linked cases.

| Parameter | Value |
|-----------|-------|
| **Endpoint** | `/api/igss2/caseinfo` |
| **File** | `case/main.go:46` |
| **Method** | `GET` |
| **Header** | `caseNumber: {case_number}` |

### 8.2 KB Article Update

Extend the `valid_to` date on a knowledge base article by 365 days and set its workflow state to Published. Part of the automated KB maintenance pipeline.

| Parameter | Value |
|-----------|-------|
| **Endpoint** | `/api/igss2/kb_create_update` |
| **File** | `main.go:552` |
| **Method** | `POST` |
| **Payload** | `{"action": "UPDATE", "kbId": "{sysid}", "workflow": "Published", "validTo": 365}` |

### 8.3 Case Update (Dev/UAT)

Update a case record via an internal staff API. Currently targets non-production environments.

| Parameter | Value |
|-----------|-------|
| **Endpoint** | `/api/igss2/caseupdatebyinternalstaff` |
| **File** | `main.go:1598` |
| **Method** | `PUT` |
| **Base URL** | `https://mingle-i03-ionapi.mingle.inforos.dev.inforcloudsuite.com/CXPDEVSUPPORT_AX3/CustomerApi/spd/SNUAT/...` |
| **Payload** | `{"caseid": "...", "staffUserSysId": "...", "description": "...", "state": 1, "comments": "..."}` |

### 8.4 KB Patch Uploads (Dev/UAT)

Retrieve KB patch upload attachments. Currently targets non-production environments.

| Parameter | Value |
|-----------|-------|
| **Endpoint** | `/api/igss2/kbpatchuploads` |
| **File** | `main.go:1637` |
| **Method** | `GET` |
| **Base URL** | `https://mingle-i03-ionapi.mingle.inforos.dev.inforcloudsuite.com/CXPDEVSUPPORT_AX3/CustomerApi/spd/SNUAT/...` |
| **Header** | `Kbids: {kb_number}` |

---

## 9. ServiceNow Query Syntax Reference

Common patterns used throughout these queries:

| Pattern | Meaning |
|---------|---------|
| `^` | AND operator |
| `^OR` | OR operator |
| `^NQ` | New Query (OR at the top level, creates a union) |
| `!=` | Not equal |
| `!=` (empty RHS) | Field is not empty |
| `state!=3` | State is not Closed |
| `stateIN3,6` | State is Closed (3) or Resolved (6) |
| `BETWEEN{start}@{end}` | Date is within a range |
| `LIKE` | Contains substring |
| `STARTSWITH` | Field begins with value |
| `IN` | Value is in a comma-separated list |
| `javascript:gs.beginningOfThisWeek()` | Server-side: start of current week |
| `javascript:gs.daysAgoStart(N)` | Server-side: midnight N days ago |

---

## 10. Manager Filter Lists

Several queries filter by `assigned_to.manager.nameIN{list}` to scope results to managed teams:

| Constant | Used By | Count |
|----------|---------|-------|
| `MANAGERS_LIST_PRIMARY` | Major cases (2.1–2.3), open cases filtered (1.4) | 18 managers |
| `MANAGERS_LIST_ESCALATED` | Escalated cases (2.4) | 21 managers |
| `MANAGERS_LIST_MAINT` | LN since-date query (1.15) | 25 managers |

Defined in `majorcase.go:13-21`.

---

## 11. GetAllFields Reference

The shared field list used by queries marked *(GetAllFields — see 1.1)*:

```
due_date, number, short_description, assigned_on, sys_created_on, closed_at,
priority, action_status, state, u_status, assigned_to, assigned_to.sys_id,
assigned_to.email, assigned_to.country, assignment_group, sold_product,
sys_updated_on, account, active_escalation, sys_id, sys_updated_by,
resolved_at, resolution_code, assigned_to.manager,
case_action_summary.number, case_action_summary.sys_updated_on,
assigned_to.sys_id, version, u_tenancy, time_worked, account.sys_id,
account.number, u_rpt_resolvetime, account.u_attribute,
active_escalation.assigned_to, entitlement, workaround_provided,
workaround_date, case_action_summary.next_steps,
case_action_summary.actions_taken, close_notes, product_line
```
