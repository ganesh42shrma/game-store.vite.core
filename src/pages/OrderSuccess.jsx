import { useParams, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const { id } = useParams();

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Payment successful</h1>
      <p className="text-gray-600 mb-6">
        Your order has been confirmed and payment is complete.
      </p>
      <div className="flex flex-wrap gap-4">
        {id && (
          <>
            <Link
              to={`/orders/${id}`}
              className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900"
            >
              View order
            </Link>
            <Link
              to={`/orders/${id}/invoice`}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700"
            >
              View invoice
            </Link>
          </>
        )}
        <Link to="/home" className="px-4 py-2 border border-gray-300 rounded text-gray-700">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
