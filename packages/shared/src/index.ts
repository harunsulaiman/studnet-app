export const APP_NAME = 'studNet' as const;

export const PRODUCT_PILLARS = ['feed', 'academics', 'messages', 'opportunities'] as const;
export type ProductPillar = (typeof PRODUCT_PILLARS)[number];

export type VerificationState =
  | 'unverified'
  | 'email_verified'
  | 'institution_email_verified'
  | 'student_id_submitted'
  | 'campus_rep_verified'
  | 'institution_verified'
  | 'organization_verified';

export type TrustLabel =
  | 'student_created'
  | 'class_rep_verified'
  | 'department_verified'
  | 'institution_verified'
  | 'organization_verified'
  | 'sponsored';

export interface ApiEnvelope<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

export interface PaginationCursor {
  cursor?: string;
  limit?: number;
}
