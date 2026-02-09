import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Landing from './pages/Landing.jsx';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Register from './pages/Register.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import Profile from './pages/Profile.jsx';
import Addresses from './pages/Addresses.jsx';
import CheckoutPay from './pages/CheckoutPay.jsx';
import InvoiceView from './pages/InvoiceView.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminProductForm from './pages/admin/AdminProductForm.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminOrderDetail from './pages/admin/AdminOrderDetail.jsx';
import AdminInvoices from './pages/admin/AdminInvoices.jsx';
import AdminInvoiceDetail from './pages/admin/AdminInvoiceDetail.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminUserForm from './pages/admin/AdminUserForm.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'login', element: <Navigate to="/" replace /> },
      { path: 'home', element: <Home /> },
      { path: 'home/sale', element: <Home /> },
      { path: 'products/:id', element: <ProductDetail /> },
      { path: 'register', element: <Register /> },
      {
        path: 'cart',
        element: (
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout/pay',
        element: (
          <ProtectedRoute>
            <CheckoutPay />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pay/:paymentId',
        element: (
          <ProtectedRoute>
            <CheckoutPay />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <ProtectedRoute>
            <OrderDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id/success',
        element: (
          <ProtectedRoute>
            <OrderSuccess />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id/invoice',
        element: (
          <ProtectedRoute>
            <InvoiceView />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile/addresses',
        element: (
          <ProtectedRoute>
            <Addresses />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
        children: [
          { index: true, element: <Navigate to="/admin/products" replace /> },
          { path: 'analytics', element: <AdminAnalytics /> },
          { path: 'products', element: <AdminProducts /> },
          { path: 'products/new', element: <AdminProductForm /> },
          { path: 'products/:id/edit', element: <AdminProductForm /> },
          { path: 'orders', element: <AdminOrders /> },
          { path: 'orders/:id', element: <AdminOrderDetail /> },
          { path: 'invoices', element: <AdminInvoices /> },
          { path: 'invoices/:id', element: <AdminInvoiceDetail /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'users/new', element: <AdminUserForm /> },
          { path: 'users/:id', element: <AdminUserForm /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
