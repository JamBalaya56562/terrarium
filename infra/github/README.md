# `infra/github/` — GitHub Settings as Code

OpenTofu configuration that manages this repository's settings declaratively,
as in [vivarium](https://github.com/aletheia-works/vivarium/tree/main/infra/github).

## Managed resources

| Resource | File |
|---|---|
| Repository (merge methods, features, topics, homepage) | `main.tf` |
| Vulnerability alerts | `main.tf` |
| Branch ruleset for `main`, with the required status checks | `main.tf` |
| Issue/PR labels | `main.tf` |

The repository and the labels created by hand before this module are adopted
by `import` blocks in `main.tf`, so the first apply starts from an empty state
without a seed.

## CI workflows

| Trigger | Workflow | Action |
|---|---|---|
| PR touching `infra/github/**` | `terraform-plan.yml` | Runs `tofu plan` and posts the diff as a PR comment |
| PR touching `infra/github/**` | `tofu-fmt-autofix.yml` | Commits `tofu fmt -recursive` fixes to the PR |
| Merge to `main` | `terraform-apply.yml` | Runs `tofu apply` |
| Weekly + post-apply | `terraform-state-backup.yml` | Copies the state to a GitHub Release Asset |

All four call the organization's reusable workflows in
[`aletheia-works/.github`](https://github.com/aletheia-works/.github) and use
the `TF_TOKEN_GITHUB` secret.

## Running locally

### 1. Create a Fine-grained PAT

Create a Fine-grained personal access token at
<https://github.com/settings/personal-access-tokens/new> with:

- **Resource owner**: the organization that owns this repository
- **Repository access**: this repository only
- **Repository permissions**: Administration (RW), Contents (RW), Metadata (R),
  Pages (RW),
  Issues (RW), Pull requests (RW), Actions (RW), Workflows (RW),
  Secrets (RW), Variables (RW), Environments (RW), Webhooks (RW),
  Dependabot alerts (RW), Code scanning alerts (RW)
- **Organization permissions**: none

CI uses the same token as the repository secret `TF_TOKEN_GITHUB`.

### 2. Prepare local files

```bash
cd infra/github
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars and set github_owner

export GITHUB_TOKEN=github_pat_xxxxxxxxxxxx
```

### 3. Fetch the latest state

The canonical state lives as an artifact on the most recent successful
`terraform-apply` run. Download it before running `plan`/`apply` locally:

```bash
gh run download --name terraform-state --dir .
```

### 4. Run tofu

```bash
tofu init
tofu plan
tofu apply
```

## State management

State is stored as a GitHub Actions artifact and mirrored to Release Assets
for long-term retention. A `concurrency` group serializes workflow runs to
avoid concurrent writes; there is no true distributed lock, so avoid running
`apply` locally while CI is running.

## File layout

```text
infra/github/
├── versions.tf                 # OpenTofu and provider versions
├── providers.tf                # GitHub provider config
├── variables.tf                # Input variables
├── main.tf                     # Repository settings, main ruleset, labels
├── terraform.tfvars.example    # Template for terraform.tfvars
├── .gitignore                  # Excludes state and secrets
├── .terraform.lock.hcl         # Provider version lock (committed)
└── README.md
```
