import type { CitizensDataFlow } from '@/app/api/types/citizens.type';

export interface Step2Props {
  infoCedula: CitizensDataFlow;
  handleNext: () => void;
  handleReset: () => void;
}
