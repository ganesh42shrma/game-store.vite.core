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
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-medium text-gray-500 mb-1 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Address
        </p>
        <div className="flex flex-wrap gap-1.5">
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
                className={`flex min-w-0 items-start gap-1.5 rounded border px-2 py-1.5 text-left text-xs transition-all ${
                  isSelected
                    ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } disabled:opacity-50`}
              >
                <span
                  className={`mt-0.5 h-3 w-3 shrink-0 rounded-full border ${
                    isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{label}</p>
                  {location && <p className="text-[10px] text-gray-500 truncate">{location}</p>}
                  {addr.isDefault && (
                    <span className="mt-0.5 inline-block rounded px-1 py-0.5 text-[9px] font-medium text-gray-500 bg-gray-100">
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
        <p className="text-[10px] font-medium text-gray-500 mb-1 flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          Payment
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PAYMENT_OPTIONS.map((opt) => {
            const isSelected = selectedPayment === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelectPayment(opt.value)}
                disabled={disabled}
                className={`flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs transition-all ${
                  isSelected
                    ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } disabled:opacity-50`}
              >
                <span
                  className={`h-3 w-3 shrink-0 rounded-full border ${
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
        className="w-full rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        Confirm purchase
      </button>
    </div>
  );
}
