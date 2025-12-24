/**
 * ============================================
 * AkademiHub - AI Prompts Index
 * ============================================
 */

// System Rules
export * from './systemRules';
export { default as SystemRules } from './systemRules';

// Glossary
export * from './glossary.tr';
export { default as Glossary } from './glossary.tr';

// Templates
export * from './templates.student';
export { default as StudentTemplates } from './templates.student';

export * from './templates.parent';
export { default as ParentTemplates } from './templates.parent';

export * from './templates.teacher';
export { default as TeacherTemplates } from './templates.teacher';

// ==================== TEMPLATE SEÇİCİ ====================

import type { PromptTemplate, AIRole } from '../types';
import { STUDENT_PROMPT_TEMPLATE } from './templates.student';
import { PARENT_PROMPT_TEMPLATE } from './templates.parent';
import { TEACHER_PROMPT_TEMPLATE } from './templates.teacher';

/**
 * Role göre prompt template seç
 */
export function getPromptTemplate(role: AIRole): PromptTemplate {
  const templates: Record<AIRole, PromptTemplate> = {
    student: STUDENT_PROMPT_TEMPLATE,
    parent: PARENT_PROMPT_TEMPLATE,
    teacher: TEACHER_PROMPT_TEMPLATE
  };
  
  return templates[role];
}

