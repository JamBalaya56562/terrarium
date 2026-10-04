variable "github_owner" {
  description = "GitHub user or organization that owns the repository"
  type        = string
}

variable "repository_name" {
  description = "Name of the repository to manage"
  type        = string
  default     = "terrarium"
}

variable "repository_description" {
  description = "Repository description"
  type        = string
  default     = "Run one CLI tool in the browser — no emulator, no kernel, just the system calls it needs. The runtime behind Vivarium's terminal reproductions."
}

variable "repository_visibility" {
  description = "Repository visibility (public or private)"
  type        = string
  default     = "public"

  validation {
    condition     = contains(["public", "private"], var.repository_visibility)
    error_message = "visibility must be either \"public\" or \"private\"."
  }
}

variable "repository_topics" {
  description = "Topics to attach to the repository"
  type        = list(string)
  default = [
    "webassembly",
    "emscripten",
    "terminal",
    "browser",
    "cli",
    "web-components",
    "bug-reproduction",
    "developer-tools",
  ]
}
