import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const id = product._id;
  const name = product.title || product.name || 'Product';
  const price = product.price != null ? Number(product.price) : 0;
  const image = product.coverImage || product.image || product.imageUrl;

  return (
    <Link
      to={`/products/${id}`}
      className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow bg-white"
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-4xl">?</span>
        )}
      </div>
      <div className="p-4">
        <h2 className="font-medium text-gray-900 truncate">{name}</h2>
        <p className="text-gray-600 mt-1">${price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
