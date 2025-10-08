#!/usr/bin/env node
import { build } from 'vite'

async function buildProject() {
  try {
    await build()
    console.log('Build completed successfully!')
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

buildProject()