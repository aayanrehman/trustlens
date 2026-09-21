#!/bin/sh
# Prompts for API keys with echo OFF and writes them to .env.local (git-ignored). Nothing is printed or logged.
cd "$(dirname "$0")/.." || exit 1
printf 'TypeSafe API key (typing is hidden): '; stty -echo; read -r TS; stty echo; printf '\n'
printf 'Google PageSpeed API key (typing is hidden, press Enter to skip): '; stty -echo; read -r PS; stty echo; printf '\n'
umask 077
printf 'TYPESAFE_API_KEY=%s\nPAGESPEED_API_KEY=%s\n' "$TS" "$PS" > .env.local
printf 'Saved to .env.local  (TypeSafe key length: %s, PageSpeed key length: %s)\n' "${#TS}" "${#PS}"
