import { ReactNode } from "react";
import type { BookingInfo } from "./IntakeStep";
declare function Form2_InformedConsent(props: {
  booking: BookingInfo;
  onNext: (data: Record<string, unknown>) => void;
  onBack: () => void;
  formNumber: number;
  formTotal: number;
}): ReactNode;
export default Form2_InformedConsent;
