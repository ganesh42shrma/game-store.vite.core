import { MapPin, CreditCard } from 'lucide-react';

const PAYMENT_OPTIONS = [
  { value: 'mock_card', label: 'Card' },
  { value: 'mock_upi', label: 'UPI' },
  { value: 'mock_netbanking', label: 'Net Banking' },
];

/**
 * Step-by-step MCQ for buy confirmation: address cards, then payment cards.
 * Sends "{addressId}, {paymentValue}" when both selected.
 */
export default function ChatBuyConfirmation({
  addresses,
  selectedAddressId,
  selectedPayment,
  onSelectAddress,
  onSelectPayment,
  onConfirm,
  disabled,
}) {
  const canConfirm = selectedAddressId && selectedPayment;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          Select address
        </p>
        <div className="flex flex-wrap gap-2">
          {addresses.map((addr) => {
            const id = addr._id || addr.id;
            const label = addr.label || 'Address';
            const location = [addr.city, addr.state].filter(Boolean).join(', ');
            const isSelected = selectedAddressId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectAddress(id)}
                disabled={disabled}
                className={`flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                  isSelected
                    ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900 ring-offset-1'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                <span
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                    isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{label}</p>
                  {location && <p className="text-xs text-gray-500">{location}</p>}
                  {addr.isDefault && (
                    <span className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100">
                      Default
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" />
          Select payment method
        </p>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map((opt) => {
            const isSelected = selectedPayment === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelectPayment(opt.value)}
                disabled={disabled}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                  isSelected
                    ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900 ring-offset-1'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                <span
                  className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                    isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                  }`}
                  aria-hidden
                />
                <span className="font-medium text-gray-900">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={!canConfirm || disabled}
        className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-900"
      >
        Confirm purchase
      </button>
    </div>
  );
}
