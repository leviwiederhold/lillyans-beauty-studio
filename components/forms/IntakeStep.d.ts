import { ReactNode } from "react";

export type BookingInfo = {
  name: string;
  price: string;
  duration: string;
  category: string;
};

declare function IntakeStep(props: {
  booking: BookingInfo;
  userId: string;
  bookingId: string | null;
  onComplete: () => void;
  onBack: () => void;
}): ReactNode;

export default IntakeStep;
