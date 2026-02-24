# ServiceNow `sysparm` Parameters Reference

A comprehensive reference of all `sysparm_*` URL and API parameters available in ServiceNow.

---

## Table of Contents

1. [List/Table View Parameters](#listtable-view-parameters)
2. [Form View Parameters](#form-view-parameters)
3. [REST API Parameters](#rest-api-parameters)
4. [Export Parameters](#export-parameters)
5. [UI & Navigation Parameters](#ui--navigation-parameters)
6. [Reporting Parameters](#reporting-parameters)
7. [Import & Processing Parameters](#import--processing-parameters)

---

## List/Table View Parameters

| Parameter | Description | Example |
|---|---|---|
| `sysparm_query` | Encoded query string to filter records | `sysparm_query=active=true^state=1` |
| `sysparm_view` | Specifies the view (list/form layout) to use | `sysparm_view=ess` |
| `sysparm_list_mode` | Sets list display mode (`normal`, `compact`) | `sysparm_list_mode=compact` |
| `sysparm_orderby` | Field name to sort ascending | `sysparm_orderby=number` |
| `sysparm_orderbydesc` | Field name to sort descending | `sysparm_orderbydesc=sys_created_on` |
| `sysparm_offset` | Record offset for pagination | `sysparm_offset=20` |
| `sysparm_limit` | Maximum number of records to return | `sysparm_limit=100` |
| `sysparm_group_by` | Group results by a specific field | `sysparm_group_by=category` |
| `sysparm_first_row` | First row to display (1-based) | `sysparm_first_row=1` |
| `sysparm_force_row_count` | Force a specific row count display | `sysparm_force_row_count=50` |
| `sysparm_search` | Full-text search string | `sysparm_search=printer issue` |
| `sysparm_fixed_query` | Additional fixed/locked query appended to the main query | `sysparm_fixed_query=active=true` |
| `sysparm_default_export_fields` | Comma-separated fields to use as export defaults | `sysparm_default_export_fields=number,short_description` |
| `sysparm_show_count` | Show record count in list header (`true`/`false`) | `sysparm_show_count=true` |
| `sysparm_no_count` | Suppress record count query (`true`/`false`) | `sysparm_no_count=true` |
| `sysparm_queryNoDomain` | Bypass domain separation in query | `sysparm_queryNoDomain=true` |

---

## Form View Parameters

| Parameter | Description | Example |
|---|---|---|
| `sysparm_view` | Specifies the form view to render | `sysparm_view=ess` |
| `sysparm_record_target` | Target table for the record | `sysparm_record_target=incident` |
| `sysparm_record_row` | Row index of the record in the list | `sysparm_record_row=1` |
| `sysparm_record_list` | Encoded list of record sys_ids for prev/next navigation | `sysparm_record_list=abc123,def456` |
| `sysparm_record_count` | Total count of records for navigation display | `sysparm_record_count=25` |
| `sysparm_sys_id` | sys_id of the record to open | `sysparm_sys_id=abc123...` |
| `sysparm_template` | Apply a template sys_id when opening a new form | `sysparm_template=abc123...` |
| `sysparm_new_record` | Open form in new record mode | `sysparm_new_record=true` |
| `sysparm_transaction_scope` | Scope for the transaction | `sysparm_transaction_scope=global` |
| `sysparm_default_vars` | Pre-populate form variables (key=value pairs) | `sysparm_default_vars=caller_id=abc123` |

---

## REST API Parameters

These parameters are used with the **Table API**, **Aggregate API**, and other REST endpoints.

### Table API (`/api/now/table/{tableName}`)

| Parameter | Description | Example |
|---|---|---|
| `sysparm_query` | Encoded query to filter results | `sysparm_query=active=true` |
| `sysparm_fields` | Comma-separated list of fields to return | `sysparm_fields=number,short_description,state` |
| `sysparm_limit` | Limit the number of results | `sysparm_limit=10` |
| `sysparm_offset` | Offset for pagination | `sysparm_offset=0` |
| `sysparm_view` | Specifies the view for field values | `sysparm_view=desktop` |
| `sysparm_display_value` | Return display values instead of raw values (`true`, `false`, `all`) | `sysparm_display_value=true` |
| `sysparm_exclude_reference_link` | Exclude reference links from response (`true`/`false`) | `sysparm_exclude_reference_link=true` |
| `sysparm_suppress_auto_sys_field` | Suppress automatic sys fields in response | `sysparm_suppress_auto_sys_field=true` |
| `sysparm_input_display_value` | Treat input values as display values (`true`/`false`) | `sysparm_input_display_value=true` |
| `sysparm_orderby` | Field to sort ascending | `sysparm_orderby=number` |
| `sysparm_orderbydesc` | Field to sort descending | `sysparm_orderbydesc=sys_created_on` |
| `sysparm_no_count` | Skip total count in response header | `sysparm_no_count=true` |
| `sysparm_read_replica_category` | Use read replica for query | `sysparm_read_replica_category=reporting` |
| `sysparm_use_view_from_fields` | Use view definitions to determine returned fields | `sysparm_use_view_from_fields=true` |

### Aggregate API (`/api/now/stats/{tableName}`)

| Parameter | Description | Example |
|---|---|---|
| `sysparm_query` | Encoded query to filter data | `sysparm_query=active=true` |
| `sysparm_count` | Return a record count (`true`/`false`) | `sysparm_count=true` |
| `sysparm_min_fields` | Fields to calculate minimum value | `sysparm_min_fields=priority` |
| `sysparm_max_fields` | Fields to calculate maximum value | `sysparm_max_fields=priority` |
| `sysparm_sum_fields` | Fields to calculate sum | `sysparm_sum_fields=business_duration` |
| `sysparm_avg_fields` | Fields to calculate average | `sysparm_avg_fields=business_duration` |
| `sysparm_group_by` | Fields to group results by | `sysparm_group_by=state,priority` |
| `sysparm_orderby` | Sort aggregate results ascending | `sysparm_orderby=state` |
| `sysparm_orderbydesc` | Sort aggregate results descending | `sysparm_orderbydesc=count` |
| `sysparm_display_value` | Return display values for group-by fields | `sysparm_display_value=true` |
| `sysparm_having_query` | Filter on aggregate results (HAVING clause) | `sysparm_having_query=COUNT>10` |

---

## Export Parameters

| Parameter | Description | Example |
|---|---|---|
| `sysparm_exportFileName` | File name for the exported file | `sysparm_exportFileName=incidents_export` |
| `sysparm_fields` | Comma-separated fields to include in export | `sysparm_fields=number,short_description` |
| `sysparm_query` | Query to filter exported data | `sysparm_query=active=true` |
| `sysparm_target` | Target export format/processor | `sysparm_target=excel` |
| `CSV` / `XLS` / `XML` / `PDF` | Appended as format parameter | `&CSV=true` |

---

## UI & Navigation Parameters

| Parameter | Description | Example |
|---|---|---|
| `sysparm_domain` | Set domain context for the session | `sysparm_domain=abc123...` |
| `sysparm_domain_restore` | Restore domain after navigation | `sysparm_domain_restore=true` |
| `sysparm_stack` | Navigation stack control | `sysparm_stack=home` |
| `sysparm_nostack` | Prevent adding to breadcrumb stack | `sysparm_nostack=true` |
| `sysparm_uri` | Target URI after redirect/login | `sysparm_uri=/incident.do` |
| `sysparm_url` | Redirect URL | `sysparm_url=https://...` |
| `sysparm_goto_url` | Navigate to a specific URL after action | `sysparm_goto_url=/incident_list.do` |
| `sysparm_ck` | Client transaction key (CSRF protection) | Auto-generated |
| `sysparm_token` | Session token for form submissions | Auto-generated |
| `sysparm_userpref_timezone` | Set timezone preference | `sysparm_userpref_timezone=Europe/Amsterdam` |
| `sysparm_language` | Override display language | `sysparm_language=nl` |
| `sysparm_compression` | Enable response compression | `sysparm_compression=true` |
| `sysparm_media` | Media/device type for responsive views | `sysparm_media=mobile` |

---

## Reporting Parameters

| Parameter | Description | Example |
|---|---|---|
| `sysparm_report_id` | sys_id of the report to run | `sysparm_report_id=abc123...` |
| `sysparm_query` | Override query for a report | `sysparm_query=active=true` |
| `sysparm_from` | Date range start | `sysparm_from=2024-01-01` |
| `sysparm_to` | Date range end | `sysparm_to=2024-12-31` |

---

## Import & Processing Parameters

| Parameter | Description | Example |
|---|---|---|
| `sysparm_import_set_table` | Target import set table | `sysparm_import_set_table=u_imp_incidents` |
| `sysparm_transform_now` | Immediately run transform after import | `sysparm_transform_now=true` |
| `sysparm_run_transform` | Trigger transform map execution | `sysparm_run_transform=true` |
| `sysparm_transform_id` | sys_id of the transform map to use | `sysparm_transform_id=abc123...` |

---

## Notes

- **Encoded queries** use `^` to join conditions and operators like `=`, `!=`, `STARTSWITH`, `ENDSWITH`, `CONTAINS`, `ISEMPTY`, `ISNOTEMPTY`, `>`, `<`, `>=`, `<=`.
- **`sysparm_display_value`** accepts `true` (display values only), `false` (raw values only), or `all` (both).
- **REST API** parameters are passed as URL query parameters on all requests to the ServiceNow REST API.
- **CSRF tokens** (`sysparm_ck`, `sysparm_token`) are automatically managed by the platform and should not be manually crafted.
- Some parameters may behave differently or be unavailable depending on your ServiceNow version (e.g., Tokyo, Utah, Vancouver, Washington, Xanadu, Yokohama, Zurich).

---

*Last updated: February 2026 — Based on ServiceNow documentation through the Zurich release.*
