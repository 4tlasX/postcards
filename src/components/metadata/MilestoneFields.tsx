'use client';

import { FormGroup, FormRow, Checkbox, PostLinker } from '@/components/form';
import type { LinkerPost } from '@/components/form';
import type { MilestoneMetadata } from '@/lib/taxonomies';

export interface MilestoneFieldsProps {
  values: MilestoneMetadata;
  onChange: (field: keyof MilestoneMetadata, value: unknown) => void;
  goals?: LinkerPost[];
}

export function MilestoneFields({ values, onChange, goals = [] }: MilestoneFieldsProps) {
  return (
    <div className="metadata-fields milestone-fields">
      <FormRow>
        <FormGroup label="Status">
          <Checkbox
            id="milestone-completed"
            name="isCompleted"
            label="Completed"
            checked={values.isCompleted}
            onChange={(e) => {
              onChange('isCompleted', e.target.checked);
              if (e.target.checked) {
                onChange('completedAt', new Date().toISOString());
              } else {
                onChange('completedAt', null);
              }
            }}
          />
          {values.completedAt && (
            <p className="field-hint">
              Completed on {new Date(values.completedAt).toLocaleDateString()}
            </p>
          )}
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Linked Goals">
          <PostLinker
            posts={goals}
            selectedIds={values.goalIds || []}
            onChange={(ids) => onChange('goalIds', ids)}
            emptyMessage="No goals yet. Create a post with the Goal topic first."
          />
        </FormGroup>
      </FormRow>
    </div>
  );
}
