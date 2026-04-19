import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AssessmentDraft = {
  clientId?: string;
  name?: string;
  sessionId?: string;
  bodySnapshot?: unknown;
  protocol?: unknown;
  voiceAudio?: unknown;
  validation?: unknown;
  deviceSession?: unknown;
  notes?: string;
};

type AssessmentDraftContextValue = {
  draft: AssessmentDraft;
  updateDraft: (patch: Partial<AssessmentDraft>) => void;
  resetDraft: () => void;
};

const STORAGE_KEY = "vivawav3_assessment_draft";

const AssessmentDraftContext = createContext<AssessmentDraftContextValue | null>(null);

function loadDraft(): AssessmentDraft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AssessmentDraft) : {};
  } catch {
    return {};
  }
}

export function AssessmentDraftProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState<AssessmentDraft>(() => loadDraft());

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const updateDraft = useCallback((patch: Partial<AssessmentDraft>) => {
    setDraft((prev) => ({
      ...prev,
      ...patch,
    }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft({});
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AssessmentDraftContextValue>(
    () => ({
      draft,
      updateDraft,
      resetDraft,
    }),
    [draft, updateDraft, resetDraft]
  );

  return (
    <AssessmentDraftContext.Provider value={value}>
      {children}
    </AssessmentDraftContext.Provider>
  );
}

export function useAssessmentDraft() {
  const ctx = useContext(AssessmentDraftContext);
  if (!ctx) {
    throw new Error("useAssessmentDraft must be used inside AssessmentDraftProvider");
  }
  return ctx;
}