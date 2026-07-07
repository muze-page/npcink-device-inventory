#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVAL_LAB_PATH="${NPCINK_EVAL_LAB_PATH:-"${PROJECT_ROOT}/../npcink-eval-lab"}"

if [ ! -d "${EVAL_LAB_PATH}" ] || [ ! -f "${EVAL_LAB_PATH}/composer.json" ]; then
  echo "Npcink Eval Lab was not found." >&2
  echo "Set NPCINK_EVAL_LAB_PATH=/path/to/npcink-eval-lab and retry." >&2
  exit 1
fi

args=()
has_project="0"
task=""

for arg in "$@"; do
  case "${arg}" in
    task=*)
      task="${arg#task=}"
      args+=("${arg}")
      ;;
    project=.)
      has_project="1"
      args+=("project=${PROJECT_ROOT}")
      ;;
    project=*)
      has_project="1"
      args+=("${arg}")
      ;;
    *)
      args+=("${arg}")
      ;;
  esac
done

case "${task}" in
  project_quality_gate|project_boundary_review_triad|project_positioning_audit)
    if [ "${has_project}" = "0" ]; then
      args+=("project=${PROJECT_ROOT}")
    fi
    ;;
esac

cd "${EVAL_LAB_PATH}"
composer eval:task -- "${args[@]}"
