import { ReactNode } from "react";
import type { BookingInfo } from "./IntakeStep";
declare function Form1_PMUIntake(props: {
  booking: BookingInfo;
  onNext: (data: Record<string, unknown>) => void;
  onBack: () => void;
  formNumber: number;
  formTotal: number;
}): ReactNode;
export default Form1_PMUIntake;
