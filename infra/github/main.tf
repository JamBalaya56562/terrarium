resource "github_repository" "this" {
  name        = var.repository_name
  description = var.repository_description
  visibility  = var.repository_visibility
  topics      = var.repository_topics

  homepage_url = "https://${var.github_owner}.github.io/${var.repository_name}/"

  has_issues      = true
  has_discussions = false
  has_projects    = true
  has_wiki        = false

  allow_merge_commit     = false
  allow_squash_merge     = true
  allow_rebase_merge     = false
  allow_auto_merge       = true
  delete_branch_on_merge = true

  web_commit_signoff_required = true

  archived = false

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [pages]
  }
}

# The repository and the labels below existed before this module: the first
# apply adopts them from an empty state instead of creating them.
import {
  to = github_repository.this
  id = var.repository_name
}

# Pages is deployed by .github/workflows/pages.yml with actions/deploy-pages.
resource "github_repository_pages" "this" {
  repository = github_repository.this.name
  build_type = "workflow"
}

import {
  to = github_repository_pages.this
  id = var.repository_name
}

resource "github_repository_vulnerability_alerts" "this" {
  repository = github_repository.this.name
}

locals {
  required_checks = [
    "check / Commitlint",
    "Polyglot lint",
    "Test terrarium package",
    "E2E (chromium)",
    "E2E (firefox)",
    "E2E (webkit)",
  ]
}

resource "github_repository_ruleset" "main" {
  name        = "main"
  repository  = github_repository.this.name
  target      = "branch"
  enforcement = "active"

  conditions {
    ref_name {
      include = ["~DEFAULT_BRANCH"]
      exclude = []
    }
  }

  bypass_actors {
    actor_id    = 5
    actor_type  = "RepositoryRole"
    bypass_mode = "always"
  }

  rules {
    deletion                = true
    non_fast_forward        = true
    required_linear_history = true
    required_signatures     = true

    pull_request {
      required_approving_review_count   = 0
      dismiss_stale_reviews_on_push     = true
      require_code_owner_review         = false
      require_last_push_approval        = false
      required_review_thread_resolution = true
    }

    required_status_checks {
      strict_required_status_checks_policy = false

      dynamic "required_check" {
        for_each = local.required_checks

        content {
          context        = required_check.value
          integration_id = 15368
        }
      }
    }
  }
}

locals {
  labels = {
    "type: bug"      = { color = "d73a4a", description = "Something isn't working" }
    "type: feature"  = { color = "a2eeef", description = "New feature or capability" }
    "type: docs"     = { color = "0075ca", description = "Documentation improvements" }
    "type: refactor" = { color = "cfd3d7", description = "Code refactoring without behavior change" }
    "type: test"     = { color = "bfdadc", description = "Test additions or improvements" }
    "type: chore"    = { color = "fef2c0", description = "Maintenance tasks" }

    "scope: ci"    = { color = "ededed", description = "CI/CD pipeline" }
    "scope: docs"  = { color = "c2e0c6", description = "Design notes under aidlc/spaces/*/knowledge and docs/" }
    "scope: infra" = { color = "5319e7", description = "Infrastructure as Code" }
    "scope: js"    = { color = "f1e05a", description = "JavaScript/TypeScript related" }
    "scope: rust"  = { color = "dea584", description = "Rust related, including the crate patches" }
    "scope: wasm"  = { color = "6f42c1", description = "WebAssembly runtime and builds" }

    "priority: p0" = { color = "b60205", description = "Critical - must fix immediately" }
    "priority: p1" = { color = "d93f0b", description = "High - important for near-term" }
    "priority: p2" = { color = "fbca04", description = "Medium - normal priority" }
    "priority: p3" = { color = "0e8a16", description = "Low - nice to have" }

    "status: triage"        = { color = "e99695", description = "Needs initial triage" }
    "status: blocked"       = { color = "000000", description = "Blocked by something" }
    "status: in-progress"   = { color = "0052cc", description = "Currently being worked on" }
    "status: apply-failure" = { color = "b60205", description = "Auto-filed when Terraform Apply fails on main; auto-closed on recovery" }

    "good-first-issue" = { color = "7057ff", description = "Good for newcomers" }
    "help-wanted"      = { color = "008672", description = "Extra attention is needed" }
  }

  # Labels created by hand before this module.
  existing_labels = toset([
    "type: bug", "type: feature", "type: docs", "type: refactor", "type: test", "type: chore",
    "scope: ci", "scope: docs", "scope: js", "scope: rust", "scope: wasm",
    "status: triage",
  ])
}

resource "github_issue_label" "labels" {
  for_each = local.labels

  repository  = github_repository.this.name
  name        = each.key
  color       = each.value.color
  description = each.value.description
}

import {
  for_each = local.existing_labels
  to       = github_issue_label.labels[each.key]
  id       = "${var.repository_name}:${each.key}"
}
