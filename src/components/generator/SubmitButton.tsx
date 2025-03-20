
import React from "react";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  isSubmitting: boolean;
  label: string;
  submittingLabel: string;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  isSubmitting,
  label,
  submittingLabel
}) => {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full py-3 bg-quicktok-orange text-white font-bold rounded-md hover:bg-quicktok-orange/90 focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50 transition-colors flex items-center justify-center"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {submittingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
};

export default SubmitButton;
