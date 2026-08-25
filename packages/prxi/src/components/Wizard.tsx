import React, { useState } from 'react';
import { Box, Text, Newline } from 'ink';

const colors = {
  bgPrimary: '#0d1117',
  borderColor: '#30363d',
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  textTertiary: '#6e7681',
  accentCyan: '#39c5cf',
  accentGreen: '#3fb950',
  accentYellow: '#d29922',
};

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
}

interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  title: string;
  children: React.ReactNode;
  onCancel?: () => void;
  onBack?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  canGoNext?: boolean;
  isLastStep?: boolean;
}

export const Wizard: React.FC<WizardProps> = ({
  steps,
  currentStep,
  title,
  children,
  onCancel,
  onBack,
  onNext,
  onFinish,
  canGoNext = true,
  isLastStep = false,
}) => {
  const totalSteps = steps.length;
  const step = steps[currentStep];

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.accentCyan}
      paddingX={2}
      paddingY={1}
      width={75}
    >
      {/* Header with title and step indicator */}
      <Box justifyContent="space-between">
        <Text bold color={colors.accentCyan}>
          {title}
        </Text>
        <Text color={colors.textSecondary}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      </Box>

      {/* Progress bar */}
      <Box marginTop={1}>
        {steps.map((s, idx) => (
          <Box key={s.id}>
            <Text
              color={
                idx < currentStep
                  ? colors.accentGreen
                  : idx === currentStep
                  ? colors.accentCyan
                  : colors.textTertiary
              }
            >
              {idx < currentStep ? '●' : idx === currentStep ? '◆' : '○'}
            </Text>
            {idx < steps.length - 1 && (
              <Text
                color={
                  idx < currentStep ? colors.accentGreen : colors.textTertiary
                }
              >
                {' '}
                ─{' '}
              </Text>
            )}
          </Box>
        ))}
      </Box>

      {/* Step title */}
      <Box marginTop={1}>
        <Text bold color={colors.textPrimary}>
          {step.title}
        </Text>
        {step.optional && (
          <Text color={colors.textTertiary}> (optional)</Text>
        )}
      </Box>

      {/* Step description */}
      {step.description && (
        <Text color={colors.textSecondary}>{step.description}</Text>
      )}

      <Newline />

      {/* Step content */}
      <Box flexDirection="column">{children}</Box>

      <Newline />

      {/* Footer with navigation */}
      <Box justifyContent="space-between">
        <Box>
          {onCancel && (
            <Text color={colors.textSecondary}>
              <Text bold>Esc</Text> Cancel
            </Text>
          )}
          {onBack && currentStep > 0 && (
            <>
              <Text color={colors.textSecondary}>  |  </Text>
              <Text color={colors.textSecondary}>
                <Text bold>←</Text> Back
              </Text>
            </>
          )}
        </Box>
        <Box>
          {isLastStep ? (
            <Text color={canGoNext ? colors.accentGreen : colors.textTertiary}>
              <Text bold>Enter</Text> Finish
            </Text>
          ) : (
            <Text color={canGoNext ? colors.accentCyan : colors.textTertiary}>
              <Text bold>Enter</Text> Next
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// Wizard with built-in input handling hook
export interface WizardState {
  currentStep: number;
  data: Record<string, any>;
}

export const useWizard = (initialData: Record<string, any> = {}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(initialData);

  const goNext = () => setCurrentStep((s) => s + 1);
  const goBack = () => setCurrentStep((s) => Math.max(0, s - 1));
  const goToStep = (step: number) => setCurrentStep(step);

  const updateData = (key: string, value: any) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const setDataFields = (fields: Record<string, any>) => {
    setData((d) => ({ ...d, ...fields }));
  };

  const reset = (newData: Record<string, any> = {}) => {
    setCurrentStep(0);
    setData(newData);
  };

  return {
    currentStep,
    data,
    goNext,
    goBack,
    goToStep,
    updateData,
    setDataFields,
    reset,
    isFirstStep: currentStep === 0,
    isLastStep: (totalSteps: number) => currentStep === totalSteps - 1,
  };
};