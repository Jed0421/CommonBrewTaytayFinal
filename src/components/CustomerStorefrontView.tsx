import React, { useState, useEffect } from 'react';
import { Product, Customer, OnlineOrder, StoreInfo, OrderItem, User } from '../types';
import { CommonBrewLogo } from './CommonBrewLogo';
import { CustomerBotDrawer } from './CustomerBotDrawer';
import { AccessPortalModal } from './AccessPortalModal';
import heroBg from '../assets/images/commonbrew_hero_1784908762215.webp';
import storeImg from '../assets/images/commonbrew_taytay_store_facade_1784910285403.webp';
import gcashQrImg from '../assets/images/gcash_qr_code_only.jpg';
import { getVerseOfTheDay } from '../data/bibleVerses';
import { commonbrewAddons, getAddonPrice, getAvailableAddonsForProduct } from '../data/commonbrewData';
import { getCategoryDrinkImage, getProductImage } from '../data/drinkImages';
import {
  MapPin,
  Coffee,
  User as UserIcon,
  KeyRound,
  ShoppingCart,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Package,
  Bike,
  Search,
  X,
  Store,
  Clock,
  Phone,
  Map,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Banknote,
  Smartphone,
  Gift,
  Plus,
  Minus,
  Trash2,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Bot,
  Utensils,
  Info,
  Receipt,
  RotateCcw,
  RefreshCw,
  Edit3,
  Save,
  Calendar,
  ExternalLink,
  Eye,
  ShoppingBag,
  Copy,
  QrCode,
  UploadCloud,
  FileImage,
  Maximize2
} from 'lucide-react';
import { useRealtimeSync } from '../lib/realtimeSync';
import { LegalDocumentsModal } from './LegalDocumentsModal';
import { CookieConsentBanner } from './CookieConsentBanner';

interface Props {
  onSwitchToStaffLogin: () => void;
  onStaffLoginSuccess?: (user: User, token?: string) => void;
}

export const CustomerStorefrontView: React.FC<Props> = ({ onSwitchToStaffLogin, onStaffLoginSuccess }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Store info
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  // Selected product for customization modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUpsize, setIsUpsize] = useState(false);
  const [sugarLevel, setSugarLevel] = useState('100%');
  const [iceLevel, setIceLevel] = useState('Regular Ice');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [modalQty, setModalQty] = useState(1);

  // Cart
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customer AI Chatbot
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Customer Account Auth
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountTab, setAccountTab] = useState<'login' | 'register' | 'profile' | 'orders'>('login');
  
  // Auth Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Mobile Phone / Email OTP Verification State
  const [regOtp, setRegOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpNotice, setOtpNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // OTP Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Auto-dismiss authSuccess banner after 5 seconds
  useEffect(() => {
    if (authSuccess) {
      const timer = setTimeout(() => {
        setAuthSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authSuccess]);

  // Auto-dismiss authError banner after 5 seconds
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        setAuthError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authError]);

  // Staff Auth Form State
  const [staffUsername, setStaffUsername] = useState('admin');
  const [staffPassword, setStaffPassword] = useState('admin123');
  const [staffRole, setStaffRole] = useState<'Administrator' | 'Cashier'>('Administrator');
  const [staffLoading, setStaffLoading] = useState(false);

  // Terms & Conditions and Privacy Policy Modal State
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');

  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderType, setOrderType] = useState<'Pickup' | 'Delivery' | 'DineIn'>('Delivery');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'Cash on Pickup' | 'Cash on Delivery'>('GCash');
  const [gcashReceiptImage, setGcashReceiptImage] = useState<string>('');
  const [gcashReceiptFileName, setGcashReceiptFileName] = useState<string>('');
  const [gcashReceiptFileSize, setGcashReceiptFileSize] = useState<string>('');
  const [isReceiptProcessing, setIsReceiptProcessing] = useState<boolean>(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const receiptInputRef = React.useRef<HTMLInputElement | null>(null);
  const [gcashReferenceNumber, setGcashReferenceNumber] = useState('');
  const [gcashReceiptError, setGcashReceiptError] = useState('');
  const [isGcashCopied, setIsGcashCopied] = useState(false);
  const [isAmountCopied, setIsAmountCopied] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [lastPlacedGcashInfo, setLastPlacedGcashInfo] = useState<{
    orderRef: string;
    totalAmount: number;
    gcashAccount: string;
    gcashRef?: string;
  } | null>(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [placedOrderRef, setPlacedOrderRef] = useState<string | null>(null);

  // Customer Orders
  const [customerOrders, setCustomerOrders] = useState<OnlineOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [addressSaving, setAddressSaving] = useState(false);
  const [reorderToast, setReorderToast] = useState('');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<OnlineOrder | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchStoreInfo();
    checkCustomerAuth();
  }, []);

  // Automatically reflect live Supabase edits on products, categories, store settings, and customer profile
  useRealtimeSync(['products', 'categories', 'store_settings', 'users', 'online_orders'], () => {
    console.log('[CustomerStorefront] Supabase change received! Auto-refreshing menu and store info...');
    fetchProducts();
    fetchCategories();
    fetchStoreInfo();
    checkCustomerAuth();
  });

  useEffect(() => {
    if (customer) {
      setAddressInput(customer.address || '');
    }
  }, [customer]);

  // Auto-dismiss reorder toast
  useEffect(() => {
    if (reorderToast) {
      const timer = setTimeout(() => setReorderToast(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [reorderToast]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products').catch(() => null);
      if (res && res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (Array.isArray(data) && data.length > 0) setProducts(data);
      }
    } catch (e) {
      console.warn('[CustomerStorefrontView] Error fetching products:', e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories').catch(() => null);
      if (res && res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (Array.isArray(data) && data.length > 0) setCategories(data);
      }
    } catch (e) {
      console.warn('[CustomerStorefrontView] Error fetching categories:', e);
    }
  };

  const fetchStoreInfo = async () => {
    try {
      const res = await fetch('/api/store-info').catch(() => null);
      if (res && res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (data) setStoreInfo(data);
      }
    } catch (e) {
      console.warn('[CustomerStorefrontView] Error fetching store info:', e);
    }
  };

  const checkCustomerAuth = async () => {
    try {
      const custToken = localStorage.getItem('commonbrew_customer_token');
      if (!custToken) {
        setCustomer(null);
        return;
      }
      const res = await fetch('/api/customer/me', {
        headers: {
          'x-customer-token': custToken
        }
      }).catch(() => null);
      if (res && res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (data && data.authenticated && data.customer) {
          const storedRegAddress = localStorage.getItem('commonbrew_reg_address') || '';
          const finalAddr = (data.customer.address || storedRegAddress || '').trim();
          if (!data.customer.address && finalAddr) {
            data.customer.address = finalAddr;
            // Background sync address to server so it's permanently stored
            fetch('/api/customer/update-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-customer-token': custToken
              },
              body: JSON.stringify({ address: finalAddr, defaultAddress: finalAddr })
            }).catch(() => {});
          }
          setCustomer(data.customer);
          setCustName(data.customer.fullName);
          setCustPhone(data.customer.phone || '');
          setCustEmail(data.customer.email || '');
          setDeliveryAddress(finalAddr);
          setAddressInput(finalAddr);
          localStorage.setItem('commonbrew_customer', JSON.stringify(data.customer));
          fetchCustomerOrders(data.customer.id);
        } else {
          localStorage.removeItem('commonbrew_customer_token');
          localStorage.removeItem('commonbrew_customer');
          setCustomer(null);
        }
      }
    } catch (e) {
      console.warn('[CustomerStorefrontView] Error checking customer auth:', e);
    }
  };


    // Lightweight refresh: updates only the loyalty points balance
  const refreshCustomerPoints = async () => {
    try {
      const custToken = localStorage.getItem('commonbrew_customer_token');
      if (!custToken) return;
      const res = await fetch('/api/customer/me', {
        headers: { 'x-customer-token': custToken }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.authenticated && data.customer) {
        setCustomer(prev => {
          if (!prev || prev.loyaltyPoints === data.customer.loyaltyPoints) return prev;
          const updated = { ...prev, loyaltyPoints: data.customer.loyaltyPoints };
          localStorage.setItem('commonbrew_customer', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      // ignore, will retry on the next tick
    }
  };

  const fetchCustomerOrders = async (custId?: string) => {
    setOrdersLoading(true);
    try {
      const custToken = localStorage.getItem('commonbrew_customer_token');
      const id = custId || customer?.id;
      const email = customer?.email;
      const phone = customer?.phone;
      const params = new URLSearchParams();
      if (id) params.append('customerId', id);
      if (email) params.append('email', email);
      if (phone) params.append('phone', phone);
      
      const queryString = params.toString();
      const url = queryString ? `/api/customer/orders?${queryString}` : '/api/customer/orders';
      const res = await fetch(url, {
        headers: {
          ...(custToken ? { 'x-customer-token': custToken } : {})
        }
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCustomerOrders(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Auto-refresh the customer's order history while the account window is open,
  // so cancel reasons (and status changes) appear without pressing Refresh.
  // Auto-refresh the loyalty balance (always) and order history (while the account window is open),
  // so cancel reasons, status changes and refunded points appear without pressing Refresh.
  useEffect(() => {
    if (!customer) return;
    refreshCustomerPoints();
    const timer = setInterval(() => {
      refreshCustomerPoints();
      if (isAccountModalOpen) fetchCustomerOrders(customer.id);
    }, 8000);
    return () => clearInterval(timer);
  }, [isAccountModalOpen, customer?.id]);

  const handleSaveAddress = async () => {
    if (!customer) return;
    const trimmed = addressInput.trim();
    setAddressSaving(true);
    try {
      const custToken = localStorage.getItem('commonbrew_customer_token');
      const res = await fetch('/api/customer/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(custToken ? { 'x-customer-token': custToken } : {})
        },
        body: JSON.stringify({ address: trimmed, defaultAddress: trimmed })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.customer) {
          setCustomer(data.customer);
          setDeliveryAddress(data.customer.address || '');
          setAddressInput(data.customer.address || '');
          localStorage.setItem('commonbrew_customer', JSON.stringify(data.customer));
          if (data.customer.address) {
            localStorage.setItem('commonbrew_reg_address', data.customer.address);
          }
        }
        setIsEditingAddress(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleReorder = (order: OnlineOrder) => {
    const newItems: OrderItem[] = order.items.map((it, idx) => {
      const prod = products.find(p => p.id === it.productId || p.name.toLowerCase() === it.productName.toLowerCase());
      return {
        id: `cart-reorder-${Date.now()}-${idx}`,
        productId: it.productId || prod?.id || `prod-reorder-${idx}`,
        name: it.productName,
        originalPrice: it.unitPrice,
        productType: prod?.productType || 'Drink',
        isUpsize: Boolean(it.isUpsize),
        addons: Array.isArray(it.addons) ? it.addons : [],
        sugarLevel: it.sugarLevel,
        iceLevel: it.iceLevel,
        specialInstructions: it.specialInstructions,
        qty: it.quantity || 1
      };
    });

    setCart(prev => [...prev, ...newItems]);
    setReorderToast(`✓ Added items from Order #${order.orderRef} to your cart!`);
    setIsAccountModalOpen(false);
    setIsCartOpen(true);
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.message || 'Login failed.');
        setAuthLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('commonbrew_customer_token', data.token);
      }
      setCustomer(data.customer);
      setCustName(data.customer.fullName);
      setCustPhone(data.customer.phone || '');
      setCustEmail(data.customer.email || '');
      setDeliveryAddress(data.customer.address || '');
      setAddressInput(data.customer.address || '');
      localStorage.setItem('commonbrew_customer', JSON.stringify(data.customer));
      if (data.customer.address) {
        localStorage.setItem('commonbrew_reg_address', data.customer.address);
      }
      setAuthSuccess('Logged in successfully!');
      setAccountTab('profile');
      fetchCustomerOrders(data.customer.id);
    } catch (e) {
      setAuthError('Connection error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!regEmail || !regEmail.includes('@')) {
      setOtpNotice({ type: 'error', message: 'Please enter a valid email address first.' });
      return;
    }

    setOtpNotice(null);
    setOtpLoading(true);

    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpNotice({ type: 'error', message: data.message || 'Failed to send verification email.' });
        return;
      }

      setOtpSent(true);
      setOtpVerified(false);
      setRegOtp('');
      setOtpCountdown(60); // 60s resend timer

      if (data.realEmailSent) {
        setOtpNotice({
          type: 'success',
          message: `✉️ Verification email sent to ${regEmail}! Please check your Inbox or Spam/Junk folder.`
        });
      } else {
        setOtpNotice({
          type: 'info',
          message: data.message || `Verification code generated for ${regEmail}. Please enter the 6-digit code received.`
        });
      }
    } catch (e) {
      setOtpNotice({ type: 'error', message: 'Connection error sending email code.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!regOtp || regOtp.trim().length !== 6) {
      setOtpNotice({ type: 'error', message: 'Please enter the complete 6-digit verification code.' });
      return;
    }

    setOtpNotice(null);
    setOtpLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, otp: regOtp })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpNotice({ type: 'error', message: data.message || 'Email verification failed.' });
        return;
      }

      setOtpVerified(true);
      setOtpNotice({
        type: 'success',
        message: 'Email address verified successfully! ✓ You can now complete registration.'
      });
    } catch (e) {
      setOtpNotice({ type: 'error', message: 'Connection error verifying email code.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!regEmail || !regEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (!otpVerified) {
      setAuthError('Email verification required! Click "Send Code" to verify your email address via OTP.');
      return;
    }

    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          username: regUsername.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          otp: regOtp,
          password: regPassword,
          address: regAddress.trim(),
          defaultAddress: regAddress.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.message || 'Registration failed.');
        setAuthLoading(false);
        return;
      }

      if (regAddress.trim()) {
        localStorage.setItem('commonbrew_reg_address', regAddress.trim());
      }
      if (data.token) {
        localStorage.setItem('commonbrew_customer_token', data.token);
      }
      const registeredCust = data.customer;
      if (registeredCust && !registeredCust.address && regAddress.trim()) {
        registeredCust.address = regAddress.trim();
      }
      setCustomer(registeredCust);
      setCustName(registeredCust.fullName);
      setCustPhone(registeredCust.phone || '');
      setCustEmail(registeredCust.email || '');
      const addr = registeredCust.address || regAddress.trim() || '';
      setDeliveryAddress(addr);
      setAddressInput(addr);
      localStorage.setItem('commonbrew_customer', JSON.stringify(registeredCust));
      setCustomerOrders([]);
      setAuthSuccess(data.message);
      setAccountTab('profile');
      fetchCustomerOrders(registeredCust.id);
    } catch (e) {
      setAuthError('Connection error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const resetAuthAndFormState = () => {
    setLoginIdentifier('');
    setLoginPassword('');
    setRegFullName('');
    setRegUsername('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setRegAddress('');
    setAuthError('');
    setAuthSuccess('');
    setRegOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtpNotice(null);
    setOtpCountdown(0);
    setAccountTab('login');
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setDeliveryAddress('');
    setCustomerOrders([]);
  };

  const handleCustomerLogout = () => {
    const custToken = localStorage.getItem('commonbrew_customer_token');

    // 1. Instantly clear customer tokens from localStorage
    localStorage.removeItem('commonbrew_customer_token');
    localStorage.removeItem('commonbrew_customer');
    localStorage.removeItem('commonbrew_reg_address');

    // 2. Instantly reset in-memory customer state
    setCustomer(null);
    setCart([]);
    setIsCartOpen(false);
    resetAuthAndFormState();
    setIsAccountModalOpen(false);

    // 3. Notify backend in the background without blocking UI
    if (custToken) {
      fetch('/api/customer/logout', {
        method: 'POST',
        headers: { 'x-customer-token': custToken }
      }).catch(() => {});
    }
  };

  const handleStaffModalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setStaffLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: staffUsername, password: staffPassword, role: staffRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.message || 'Invalid credentials or role mismatch.');
        setStaffLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('commonbrew_staff_token', data.token);
      }

      setIsAccountModalOpen(false);
      setAuthSuccess('Staff authenticated successfully.');
      if (onStaffLoginSuccess) {
        onStaffLoginSuccess(data.user, data.token);
      } else {
        onSwitchToStaffLogin();
      }
    } catch (err) {
      setAuthError('Failed to connect to authentication server.');
    } finally {
      setStaffLoading(false);
    }
  };

  // Open Product Customization Modal
  const handleOpenProduct = (prod: Product) => {
    if (!customer) {
      setIsAccountModalOpen(true);
      setAccountTab('login');
      return;
    }
    setSelectedProduct(prod);
    setIsUpsize(false);
    setSugarLevel('100%');
    setIceLevel('Regular Ice');
    setSelectedAddons([]);
    setSpecialInstructions('');
    setModalQty(1);
  };

  const toggleAddon = (addon: string) => {
    if (selectedAddons.includes(addon)) {
      setSelectedAddons(selectedAddons.filter(a => a !== addon));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const basePrice = selectedProduct.price;
    const upsizeAdd = (isUpsize && selectedProduct.upsizePrice) ? (selectedProduct.upsizePrice - basePrice) : 0;
    const addonPrice = selectedAddons.reduce((sum, addon) => sum + getAddonPrice(addon), 0);
    const unitPrice = basePrice + upsizeAdd + addonPrice;

    const newItem: OrderItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productId: selectedProduct.id,
      name: selectedProduct.name,
      originalPrice: unitPrice,
      productType: selectedProduct.productType,
      isUpsize,
      addons: selectedAddons,
      sugarLevel: selectedProduct.productType === 'Drink' ? sugarLevel : undefined,
      iceLevel: selectedProduct.productType === 'Drink' ? iceLevel : undefined,
      specialInstructions,
      qty: modalQty
    };

    setCart([...cart, newItem]);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (id: string, delta: number) => {
    setCart(cart.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : null;
      }
      return i;
    }).filter(Boolean) as OrderItem[]);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.originalPrice * item.qty), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const deliveryFee = orderType === 'Delivery' ? 45 : 0;
  const currentCustomerPoints = customer?.loyaltyPoints || 0;
  const canRedeemPoints = currentCustomerPoints >= 100;
  const loyaltyDiscount = (useLoyaltyPoints && canRedeemPoints) ? Math.min(110, cartSubtotal + deliveryFee) : 0;
  const cartTotal = Math.max(0, cartSubtotal + deliveryFee - loyaltyDiscount);

  // Open / Proceed to GCash app with deep links and auto-copy recipient account number
  const handleOpenGCashApp = (amountToPay?: number) => {
    // 1. Copy GCash account 09474960778 to clipboard automatically for convenient Express Send
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText('09474960778').catch(() => {});
      setIsGcashCopied(true);
      setTimeout(() => setIsGcashCopied(false), 3500);
    }

    // 2. Launch GCash App via URI deep links
    try {
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isAndroid) {
        // Android intent to open the installed GCash application
        window.location.href = 'intent://#Intent;scheme=gcash;package=com.globe.gcash.android;end';
      } else if (isIOS) {
        // iOS URL scheme for GCash
        window.location.href = 'gcash://';
      } else {
        // Fallback for general browsers or desktop test
        window.location.href = 'gcash://app';
      }
    } catch (err) {
      console.warn('GCash deep link launch attempt:', err);
    }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGcashReceiptError('');

    if (!file.type.startsWith('image/')) {
      setGcashReceiptError('Please upload a valid image file (PNG, JPG, JPEG, WEBP) of your GCash receipt.');
      return;
    }

    setIsReceiptProcessing(true);
    setGcashReceiptFileName(file.name);
    const sizeKb = Math.round(file.size / 1024);
    setGcashReceiptFileSize(sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setIsReceiptProcessing(false);
        return;
      }

      // Optimize receipt image to max 1200px so it's sharp to read transaction details, but lightweight
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setGcashReceiptImage(compressed);
        } else {
          setGcashReceiptImage(rawDataUrl);
        }
        setIsReceiptProcessing(false);
      };
      img.onerror = () => {
        setGcashReceiptImage(rawDataUrl);
        setIsReceiptProcessing(false);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setIsReceiptProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setGcashReceiptImage('');
    setGcashReceiptFileName('');
    setGcashReceiptFileSize('');
    if (receiptInputRef.current) {
      receiptInputRef.current.value = '';
    }
  };

  // Submit Online Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Strict validation: GCash orders CANNOT proceed without GCash Payment Receipt
    if (paymentMethod === 'GCash' && !gcashReceiptImage) {
      setGcashReceiptError('GCash Payment Receipt is required! Please complete your payment in GCash, download or screenshot your receipt, and upload it below before confirming your order.');
      const uploadEl = document.getElementById('gcash-receipt-upload-section');
      if (uploadEl) {
        uploadEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setOrderPlacing(true);
    try {
      const itemsPayload = cart.map(item => ({
        productId: item.productId || item.id,
        productName: item.name + (item.isUpsize ? ' (22oz Upsize)' : ''),
        unitPrice: item.originalPrice,
        quantity: item.qty,
        isUpsize: item.isUpsize,
        sugarLevel: item.sugarLevel,
        iceLevel: item.iceLevel,
        addons: item.addons,
        specialInstructions: item.specialInstructions
      }));

      const custToken = localStorage.getItem('commonbrew_customer_token');
      const res = await fetch('/api/online-orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(custToken ? { 'x-customer-token': custToken } : {})
        },
        body: JSON.stringify({
          customerName: custName,
          customerPhone: custPhone,
          customerEmail: custEmail,
          orderType,
          deliveryAddress,
          tableNumber,
          paymentMethod,
          gcashReferenceNumber: paymentMethod === 'GCash' && gcashReferenceNumber.trim() ? gcashReferenceNumber.trim() : undefined,
          gcashReceiptImage: paymentMethod === 'GCash' ? gcashReceiptImage : undefined,
          items: itemsPayload,
          notes: checkoutNotes,
          useLoyaltyPoints: Boolean(useLoyaltyPoints && canRedeemPoints)
        })
      });

      const data = await res.json();
      if (data.success) {
        setPlacedOrderRef(data.orderRef);
        if (paymentMethod === 'GCash') {
          setLastPlacedGcashInfo({
            orderRef: data.orderRef,
            totalAmount: cartTotal,
            gcashAccount: '09474960778',
            gcashRef: gcashReferenceNumber.trim() || undefined
          });
        }
        setCart([]);
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        setUseLoyaltyPoints(false);
        setGcashReferenceNumber('');
        setGcashReceiptImage('');
        setGcashReceiptFileName('');
        setGcashReceiptFileSize('');
        setGcashReceiptError('');
        if (receiptInputRef.current) receiptInputRef.current.value = '';
        if (data.customer) {
          setCustomer(data.customer);
          localStorage.setItem('commonbrew_customer', JSON.stringify(data.customer));
        }
        if (customer) {
          fetchCustomerOrders(customer.id);
          checkCustomerAuth();
        }
      } else {
        alert(data.message || 'Error placing online order');
      }
    } catch (e) {
      alert('Network error while placing order');
    } finally {
      setOrderPlacing(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const todayVerse = getVerseOfTheDay();

  return (
    <div style={{ background: '#fdfbf7', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Announcement Bar */}
      <div style={{ background: '#111827', color: '#f3f4f6', padding: '0.5rem 1rem', fontSize: '0.8rem', textAlign: 'center', fontWeight: 600, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
        <MapPin size={14} style={{ color: '#FF5E00' }} />
        <span><strong>CommonBrew Taytay</strong>: Open Daily 11:00 AM - 9:00 PM | Free High-Speed WiFi!</span>
      </div>

      {/* Navigation Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CommonBrewLogo variant="full" size="md" color="#FF5E00" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'nowrap' }}>
            <a
              href="#showcase"
              className="storefront-nav-link"
              style={{
                color: '#1f2937',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                padding: '0.5rem 0.95rem',
                borderRadius: '10px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
              }}
            >
              <Utensils size={16} style={{ color: '#FF5E00' }} />
              <span>Menu</span>
            </a>

            <a
              href="#about"
              className="storefront-nav-link"
              style={{
                color: '#1f2937',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                padding: '0.5rem 0.95rem',
                borderRadius: '10px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
              }}
            >
              <Info size={16} style={{ color: '#FF5E00' }} />
              <span>About Us</span>
            </a>

            {/* Account / Login Choice Button */}
            <button
              onClick={() => {
                setIsAccountModalOpen(true);
                setAccountTab(customer ? 'profile' : 'login');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: customer ? '#fff7ed' : '#111827',
                color: customer ? '#ea580c' : '#ffffff',
                border: customer ? '1.5px solid #ffedd5' : 'none',
                padding: '0.5rem 1rem',
                borderRadius: '24px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.85rem',
                boxShadow: customer ? 'none' : '0 4px 12px rgba(17, 24, 39, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{customer ? <UserIcon size={16} /> : <KeyRound size={16} />}</span>
              <span>{customer ? customer.fullName.split(' ')[0] : 'Sign in / Sign up'}</span>
              {customer && (
                <span style={{ background: '#FF5E00', color: '#ffffff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 800, marginLeft: '0.2rem' }}>
                  {customer.loyaltyPoints} pts
                </span>
              )}
            </button>

            {/* Direct Sign Out Button for Logged-In Customer */}
            {customer && (
              <button
                type="button"
                onClick={handleCustomerLogout}
                title="Sign out of customer account"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1.5px solid #fecaca',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.08)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                  e.currentTarget.style.color = '#dc2626';
                }}
              >
                <span>Sign Out</span>
              </button>
            )}

            {/* Cart Button (Only visible when user is logged in) */}
            {customer && (
              <button
                onClick={() => setIsCartOpen(true)}
                style={{
                  position: 'relative',
                  background: '#FF5E00',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 14px rgba(255, 94, 0, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <ShoppingCart size={16} />
                <span>Cart</span>
                {cartItemCount > 0 && (
                  <span style={{ background: '#111827', color: '#ffffff', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900 }}>
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Showcase Banner */}
      <section
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.72) 0%, rgba(15, 23, 42, 0.90) 100%), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#fff',
          padding: '4.5rem 1.5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 94, 0, 0.2)', color: '#ff8c42', padding: '6px 18px', borderRadius: '24px', fontSize: '0.825rem', fontWeight: 800, border: '1px solid rgba(255, 94, 0, 0.4)', backdropFilter: 'blur(8px)' }}>
              <Sparkles size={14} />
              <span>Open Daily 11:00 AM - 9:00 PM</span>
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <CommonBrewLogo variant="full" size="xl" color="#FF5E00" />
          </div>

          {/* Bible Verse */}
          <div
            style={{
              margin: '0 auto 2.25rem',
              maxWidth: '680px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '1.15rem', color: '#f8fafc', fontStyle: 'italic', margin: '0 0 0.5rem', lineHeight: 1.6, fontWeight: 500 }}>
              "{todayVerse.text}"
            </p>
            <p style={{ fontSize: '0.9rem', color: '#ff8c42', fontWeight: 800, margin: 0 }}>
              — {todayVerse.reference}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#showcase" style={{ background: '#FF5E00', color: '#fff', padding: '0.85rem 2.25rem', borderRadius: '30px', fontWeight: 800, textDecoration: 'none', boxShadow: '0 6px 20px rgba(255, 94, 0, 0.45)', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Coffee size={18} />
              <span>Browse Menu & Order</span>
            </a>
            <a href="#about" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '0.85rem 2rem', borderRadius: '30px', fontWeight: 700, textDecoration: 'none', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} />
              <span>Store Location & Hours</span>
            </a>
          </div>
        </div>
      </section>

      {/* Order Ref Success Alert */}
      {placedOrderRef && (
        <div style={{ maxWidth: '1200px', margin: '1.5rem auto 0', padding: '0 1.5rem' }}>
          <div style={{ background: '#ecfdf5', border: '2px solid #10b981', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#065f46', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} style={{ color: '#059669' }} /> Order Placed Successfully!
                </h3>
                <p style={{ margin: '0.25rem 0 0', color: '#047857', fontSize: '0.9rem' }}>
                  Your order reference code is <strong>{placedOrderRef}</strong>. You can track status live in your Customer Account!
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAccountModalOpen(true);
                  setAccountTab('orders');
                }}
                style={{ background: '#059669', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>Track Order</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* GCash Quick Action / Confirmation Card if paid via GCash */}
            {lastPlacedGcashInfo && lastPlacedGcashInfo.orderRef === placedOrderRef && (
              <div style={{
                marginTop: '1rem',
                paddingTop: '0.9rem',
                borderTop: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                background: '#ffffff',
                padding: '0.9rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid #007dfe'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: '#007dfe', color: '#fff', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontWeight: 900, color: '#0056b3', fontSize: '0.9rem' }}>
                      GCash Payment Destination: 09474960778
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#4b5563' }}>
                      CommonBrew Taytay • Total Due: <strong style={{ color: '#007dfe' }}>₱{lastPlacedGcashInfo.totalAmount}</strong>
                      <span> • Payment Proof: <strong style={{ color: '#059669' }}>GCash Receipt Uploaded ✓</strong></span>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenGCashApp(lastPlacedGcashInfo.totalAmount)}
                    style={{
                      background: '#007dfe',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 0.9rem',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 2px 6px rgba(0, 125, 254, 0.25)'
                    }}
                  >
                    <Smartphone size={14} />
                    <span>Open GCash App</span>
                    <ExternalLink size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator?.clipboard?.writeText) {
                        navigator.clipboard.writeText('09474960778');
                        setIsGcashCopied(true);
                        setTimeout(() => setIsGcashCopied(false), 3000);
                      }
                    }}
                    style={{
                      background: isGcashCopied ? '#10b981' : '#eff6ff',
                      color: isGcashCopied ? '#ffffff' : '#007dfe',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '0.5rem 0.85rem',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {isGcashCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isGcashCopied ? 'Copied 09474960778! ✓' : 'Copy 09474960778'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Product Showcase Section */}
      <section id="showcase" style={{ maxWidth: '1200px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2c1810', margin: 0 }}>Product Showcase</h2>
            <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>Choose your favorite drinks & food items to customize</p>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '400px', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search iced latte, croissant, matcha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.25rem', borderRadius: '20px', border: '1px solid #d1d5db', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveCategory('all')}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '20px', border: 'none', background: activeCategory === 'all' ? '#3d2314' : '#f3ece3', color: activeCategory === 'all' ? '#fff' : '#3d2314', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            All Menu
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '20px', border: 'none', background: activeCategory === c.id ? '#3d2314' : '#f3ece3', color: activeCategory === c.id ? '#fff' : '#3d2314', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.25rem' }}>
          {filteredProducts.map(prod => (
            <div
              key={prod.id}
              className="sf-product-card"
            >
              <div style={{ height: '180px', position: 'relative', overflow: 'hidden', background: '#f3ece3' }}>
                <img
                  src={getProductImage(prod.imageUrl, prod.categoryId, prod.name)}
                  alt={prod.name}
                  className="sf-product-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getCategoryDrinkImage(prod.categoryId, prod.name);
                  }}
                />
                <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                  {prod.productType}
                </span>
              </div>

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700, textTransform: 'uppercase' }}>{prod.categoryName || 'Coffee'}</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1f2937', margin: '0.25rem 0 0.5rem' }}>{prod.name}</h3>
                  <p style={{ fontSize: '0.825rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                    {prod.description || (prod.productType === 'Food' ? 'Freshly prepared delicious snack & pastry.' : 'Freshly crafted using premium Philippine beans and organic dairy.')}
                  </p>
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2c1810' }}>₱{prod.price}</span>
                    {prod.upsizePrice && <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>Upsize: ₱{prod.upsizePrice}</span>}
                  </div>

                  {prod.isOutOfStock ? (
                    <button
                      disabled
                      style={{ background: '#9ca3af', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.825rem', cursor: 'not-allowed', opacity: 0.7 }}
                    >
                      Out of Stock
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenProduct(prod)}
                      style={{ background: '#3d2314', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer' }}
                    >
                      + Add to cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About CommonBrew Section */}
      <section id="about" style={{ background: '#f5eee6', padding: '4rem 1.5rem', marginTop: '4rem', borderTop: '1px solid #e8dfd5' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>About Our Brews</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#2c1810', marginTop: '0.5rem', marginBottom: '1rem', lineHeight: 1.2 }}>
              CommonBrew Taytay
            </h2>
            <p style={{ color: '#4b5563', lineHeight: 1.7, fontSize: '0.975rem', marginBottom: '1.5rem' }}>
              {storeInfo?.aboutText}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <Clock size={22} style={{ color: '#FF5E00' }} />
                <h4 style={{ margin: '0.5rem 0 0.25rem', fontSize: '0.9rem', fontWeight: 800 }}>Operating Hours</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>{storeInfo?.hours}</p>
              </div>

              <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <Phone size={22} style={{ color: '#FF5E00' }} />
                <h4 style={{ margin: '0.5rem 0 0.25rem', fontSize: '0.9rem', fontWeight: 800 }}>Contact & Support</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>{storeInfo?.phone}</p>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2c1810', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} style={{ color: '#FF5E00' }} /> CommonBrew Taytay Store Location
            </h3>
            <p style={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              <strong>Address:</strong> {storeInfo?.address}
            </p>

            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', position: 'relative' }}>
              <img
                src={storeImg}
                alt="CommonBrew Taytay Store Facade"
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(28, 13, 2, 0.9), transparent)', padding: '1rem', color: '#fff' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#FF5E00', color: '#fff', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  Coffee Store & Cafe
                </span>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>CommonBrew Taytay Store</p>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>Unit 7 Leoncio Commercial Bldg, Sitio Ilog Pugad, San Juan, Taytay</p>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <a
                href={storeInfo?.mapsUrl || 'https://maps.app.goo.gl/JAGTV9hGCi2FM9TDA'}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, background: '#2c1810', color: '#fff', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(44, 24, 16, 0.2)' }}
              >
                <span>Open in Google Maps</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1c0d02', color: '#a39082', padding: '3rem 1.5rem 2rem', textAlign: 'center', fontSize: '0.85rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
          <p style={{ fontWeight: 800, color: '#fff', fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
            <Coffee size={20} style={{ color: '#FF5E00' }} /> CommonBrew Coffee Taytay
          </p>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem', maxWidth: '520px', lineHeight: 1.5 }}>
            Handcrafted espresso beverages, fresh tea blends, and comfort food in Taytay, Rizal.
          </p>

          {/* Quick Legal Policy Links */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '1.25rem', margin: '0.4rem 0', fontSize: '0.85rem' }}>
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('terms');
                setShowLegalModal(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fed7aa',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                padding: '0.2rem 0.4rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#fed7aa')}
            >
              📜 Terms and Conditions
            </button>

            <span style={{ color: '#475569' }}>•</span>

            <button
              type="button"
              onClick={() => {
                setLegalModalTab('privacy');
                setShowLegalModal(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fed7aa',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                padding: '0.2rem 0.4rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#fed7aa')}
            >
              🛡️ Privacy Policy (RA 10173)
            </button>
          </div>

          <div style={{ borderTop: '1px solid #332014', width: '100%', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', color: '#64748b' }}>
            <p style={{ margin: 0 }}>© 2026 CommonBrew Coffee Taytay. All rights reserved.</p>
            <p style={{ margin: 0 }}>Manila East Road, Brgy. San Juan, Taytay, Rizal • Tel: 0947-496-0778</p>
          </div>
        </div>
      </footer>

      {/* Product Customization Modal */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '480px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ height: '160px', position: 'relative', background: '#3d2314' }}>
              <img
                src={getProductImage(selectedProduct.imageUrl, selectedProduct.categoryId, selectedProduct.name)}
                alt={selectedProduct.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getCategoryDrinkImage(selectedProduct.categoryId, selectedProduct.name);
                }}
              />
              <button
                onClick={() => setSelectedProduct(null)}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1f2937' }}>{selectedProduct.name}</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Base Price: ₱{selectedProduct.price}</p>
                </div>
              </div>

              {/* Upsize Option */}
              {selectedProduct.upsizePrice && (
                <div style={{ marginTop: '1.25rem', background: '#fdf8f3', border: '1px solid #f3e8dc', borderRadius: '12px', padding: '0.9rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: '#2c1810' }}>
                    <span>{selectedProduct.categoryId === 'cat-hotcoffee' ? 'Upsize to 16oz Hot Paper Cup' : 'Upsize to 22oz (Large)'}</span>
                    <input
                      type="checkbox"
                      checked={isUpsize}
                      onChange={(e) => setIsUpsize(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#3d2314' }}
                    />
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#8c6b58', display: 'block', marginTop: '2px' }}>
                    +₱{selectedProduct.upsizePrice - selectedProduct.price} {selectedProduct.categoryId === 'cat-hotcoffee' ? 'for larger 16oz hot paper cup & extra shot' : 'for extra shot & 22oz upsize cup'}
                  </span>
                </div>
              )}

              {/* Drink Sugar & Ice Level */}
              {selectedProduct.productType === 'Drink' && (
                <>
                  <div style={{ marginTop: '1.25rem' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: '0.5rem' }}>Sugar Level</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['0%', '25%', '50%', '75%', '100%'].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSugarLevel(lvl)}
                          style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', border: '1px solid #d1d5db', background: sugarLevel === lvl ? '#3d2314' : '#fff', color: sugarLevel === lvl ? '#fff' : '#374151', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '1.25rem' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: '0.5rem' }}>Ice Level</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setIceLevel(lvl)}
                          style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', border: '1px solid #d1d5db', background: iceLevel === lvl ? '#3d2314' : '#fff', color: iceLevel === lvl ? '#fff' : '#374151', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Addons */}
              {(() => {
                const availableAddons = getAvailableAddonsForProduct(selectedProduct);
                if (availableAddons.length === 0) return null;

                return (
                  <div style={{ marginTop: '1.25rem' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: '0.5rem' }}>
                      Select Add-ons {availableAddons.length === 1 ? '(Optional)' : ''}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: availableAddons.length === 1 ? '1fr' : '1fr 1fr', gap: '0.5rem' }}>
                      {availableAddons.map(addon => (
                        <button
                          key={addon.name}
                          type="button"
                          onClick={() => toggleAddon(addon.name)}
                          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #d1d5db', background: selectedAddons.includes(addon.name) ? '#fef3c7' : '#fff', borderColor: selectedAddons.includes(addon.name) ? '#d97706' : '#d1d5db', color: '#1f2937', fontWeight: 600, fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {selectedAddons.includes(addon.name) ? <Check size={14} style={{ color: '#d97706' }} /> : <Plus size={14} />}
                            <span>{addon.name}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>+₱{addon.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Special Instructions */}
              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: '0.25rem' }}>Special Instructions / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Extra hot, separate ice, leave at gate..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>

              {/* Qty & Add to cart */}
              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
                  <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} style={{ padding: '0.5rem 0.8rem', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontWeight: 800 }}><Minus size={14} /></button>
                  <span style={{ padding: '0 1rem', fontWeight: 800 }}>{modalQty}</span>
                  <button onClick={() => setModalQty(modalQty + 1)} style={{ padding: '0.5rem 0.8rem', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontWeight: 800 }}><Plus size={14} /></button>
                </div>

                <button
                  onClick={handleAddToCart}
                  style={{ flex: 1, background: '#3d2314', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}
                >
                  Add to Cart • ₱{(selectedProduct.price + (isUpsize && selectedProduct.upsizePrice ? selectedProduct.upsizePrice - selectedProduct.price : 0) + selectedAddons.reduce((sum, a) => sum + getAddonPrice(a), 0)) * modalQty}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '420px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.25rem', background: '#3d2314', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={20} /> Your Online Cart ({cartItemCount})
              </h3>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
                  <ShoppingCart size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
                  <p style={{ fontWeight: 700, margin: 0 }}>Your cart is empty</p>
                  <p style={{ fontSize: '0.85rem' }}>Add some drinks & pastries to get started!</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{ background: '#fdf8f3', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', border: '1px solid #f3e8dc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#1f2937' }}>
                          {item.name} {item.isUpsize && <span style={{ color: '#d97706', fontSize: '0.75rem' }}>(22oz)</span>}
                        </h4>
                        {item.sugarLevel && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>Sugar: {item.sugarLevel} | Ice: {item.iceLevel}</p>}
                        {item.addons.length > 0 && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#059669' }}>Addons: {item.addons.join(', ')}</p>}
                      </div>
                      <span style={{ fontWeight: 800, color: '#3d2314', fontSize: '0.95rem' }}>₱{item.originalPrice * item.qty}</span>
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff' }}>
                        <button onClick={() => handleUpdateCartQty(item.id, -1)} style={{ padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800 }}><Minus size={12} /></button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, padding: '0 8px' }}>{item.qty}</span>
                        <button onClick={() => handleUpdateCartQty(item.id, 1)} style={{ padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800 }}><Plus size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid #f3e8dc', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                  <span>Subtotal</span>
                  <span>₱{cartSubtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 900, color: '#2c1810' }}>
                  <span>Estimated Total</span>
                  <span>₱{cartSubtotal}</span>
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  style={{ width: '100%', background: '#d97706', color: '#fff', border: 'none', padding: '0.9rem', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '520px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#3d2314', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={20} /> Online Order Checkout
              </h3>
              <button onClick={() => setIsCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
              {/* Order Type Selection */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: '0.5rem' }}>Select Order Type</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { type: 'Delivery', label: 'Delivery (+₱45)', icon: <Bike size={16} /> },
                    { type: 'Pickup', label: 'Store Pickup', icon: <Store size={16} /> },
                    { type: 'DineIn', label: 'Dine-In Table', icon: <Coffee size={16} /> }
                  ].map(t => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setOrderType(t.type as any)}
                      style={{ flex: 1, padding: '0.6rem 0.4rem', borderRadius: '10px', border: '1px solid #d1d5db', background: orderType === t.type ? '#3d2314' : '#fff', color: orderType === t.type ? '#fff' : '#374151', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#374151', marginBottom: '0.25rem' }}>Your Name *</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#374151', marginBottom: '0.25rem' }}>Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="0917XXXXXXX"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Customer Email for Delivery & Status Updates */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#374151', marginBottom: '0.25rem' }}>
                  <span>Email Address (for Status & Delivery Updates)</span>
                  <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>Get email updates</span>
                </label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>

              {orderType === 'Delivery' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#374151', marginBottom: '0.25rem' }}>Taytay Delivery Address *</label>
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House/Unit #, Street, Barangay, Taytay, Rizal"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              {orderType === 'DineIn' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#374151', marginBottom: '0.25rem' }}>Table Number</label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. Table 4"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              {/* Payment Method */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: '0.5rem' }}>Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { pm: 'GCash', icon: <Smartphone size={14} /> },
                    { pm: 'Cash on Pickup', icon: <Banknote size={14} /> },
                    { pm: 'Cash on Delivery', icon: <Banknote size={14} /> }
                  ].map(item => (
                    <button
                      key={item.pm}
                      type="button"
                      onClick={() => setPaymentMethod(item.pm as any)}
                      style={{ padding: '0.55rem', borderRadius: '8px', border: paymentMethod === item.pm ? '1px solid #FF5E00' : '1px solid var(--border)', background: paymentMethod === item.pm ? '#FF5E00' : 'var(--surface)', color: paymentMethod === item.pm ? '#ffffff' : 'var(--text)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      {item.icon}
                      <span>{item.pm}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* GCash Direct Payment Gateway Card */}
              {paymentMethod === 'GCash' && (
                <div style={{
                  background: 'linear-gradient(135deg, #0052cc 0%, #007dfe 100%)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  color: '#ffffff',
                  marginBottom: '1.25rem',
                  boxShadow: '0 10px 28px rgba(0, 125, 254, 0.28)',
                  border: '1px solid rgba(255,255,255,0.22)'
                }}>
                  {/* GCash Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ background: '#ffffff', color: '#007dfe', borderRadius: '8px', padding: '4px 9px', fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.12)' }}>
                        <Smartphone size={16} />
                        <span>GCash</span>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: '#e0f2fe', fontWeight: 700 }}>Scan QR or Express Send</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.22)', padding: '3px 9px', borderRadius: '12px', fontWeight: 800, letterSpacing: '0.02em' }}>
                      Official CommonBrew QR
                    </span>
                  </div>

                  {/* AUTO-SHOWN GCASH QR CODE CARD */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '1rem',
                    color: '#1f2937',
                    textAlign: 'center',
                    marginBottom: '1rem',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.18)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ background: '#007dfe', color: '#fff', fontWeight: 900, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px' }}>
                        GCash QR
                      </span>
                      <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#0052cc' }}>
                        CommonBrew Taytay
                      </span>
                    </div>

                    {/* QR Code Image - Square QR Only */}
                    <div 
                      style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
                      onClick={() => setIsQrModalOpen(true)}
                      title="Click to view full size QR"
                    >
                      <div style={{
                        background: '#ffffff',
                        padding: '8px',
                        borderRadius: '12px',
                        border: '1.5px solid #e2e8f0',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                        display: 'inline-block'
                      }}>
                        <img
                          src={gcashQrImg}
                          alt="CommonBrew GCash Official QR Code"
                          referrerPolicy="no-referrer"
                          style={{
                            width: '210px',
                            height: '210px',
                            aspectRatio: '1 / 1',
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto',
                            borderRadius: '6px'
                          }}
                        />
                      </div>
                      <div style={{
                        marginTop: '6px',
                        fontSize: '0.72rem',
                        color: '#0052cc',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}>
                        <QrCode size={13} />
                        <span>Tap QR image to enlarge</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '8px', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ color: '#64748b' }}>Account Name:</span>
                        <strong style={{ color: '#0052cc', fontWeight: 800 }}>JE*****H G.</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ color: '#64748b' }}>Mobile Number:</span>
                        <strong style={{ color: '#1e293b', fontWeight: 800 }}>09474960778</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>Exact Amount:</span>
                        <strong style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 900 }}>₱{cartTotal}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Recipient Account & Amount Quick Copy */}
                  <div style={{ background: 'rgba(0, 32, 77, 0.45)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '0.85rem', marginBottom: '0.85rem', border: '1px solid rgba(255,255,255,0.14)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#93c5fd', fontWeight: 700, letterSpacing: '0.04em', display: 'block' }}>
                          GCash Number
                        </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.04em', color: '#ffffff' }}>
                          09474960778
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator?.clipboard?.writeText) {
                            navigator.clipboard.writeText('09474960778');
                            setIsGcashCopied(true);
                            setTimeout(() => setIsGcashCopied(false), 3000);
                          }
                        }}
                        style={{
                          background: isGcashCopied ? '#10b981' : '#ffffff',
                          color: isGcashCopied ? '#ffffff' : '#007dfe',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.45rem 0.75rem',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                        }}
                      >
                        {isGcashCopied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{isGcashCopied ? 'Copied! ✓' : 'Copy Number'}</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 600 }}>Amount to Send:</span>
                        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fef08a', marginLeft: '6px' }}>
                          ₱{cartTotal}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator?.clipboard?.writeText) {
                            navigator.clipboard.writeText(String(cartTotal));
                            setIsAmountCopied(true);
                            setTimeout(() => setIsAmountCopied(false), 3000);
                          }
                        }}
                        style={{
                          background: isAmountCopied ? '#10b981' : 'rgba(255,255,255,0.15)',
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.3)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        {isAmountCopied ? <Check size={12} /> : <Copy size={12} />}
                        <span>{isAmountCopied ? 'Copied!' : 'Copy Amount'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Open / Proceed to GCash App Button */}
                  <div style={{ marginBottom: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenGCashApp(cartTotal)}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        color: '#0052cc',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        fontWeight: 900,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    >
                      <Smartphone size={17} style={{ color: '#007dfe' }} />
                      <span>Proceed to GCash App</span>
                      <ExternalLink size={13} style={{ opacity: 0.7 }} />
                    </button>
                  </div>

                  {/* Step Directions */}
                  <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '0.85rem', fontSize: '0.78rem', lineHeight: '1.5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fef08a', fontWeight: 900, marginBottom: '6px', fontSize: '0.82rem' }}>
                      <Receipt size={16} />
                      <span>How to Pay & Upload GCash Receipt:</span>
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#f0f9ff', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <li>
                        <strong>Step 1:</strong> Scan the <strong>QR code above</strong> or tap <strong>Proceed to GCash App</strong>, then send exact amount <strong>₱{cartTotal}</strong> to <strong>09474960778</strong> (JE*****H G.).
                      </li>
                      <li>
                        <strong>Step 2:</strong> In the GCash app, after payment succeeds, tap <strong>"Save / Download Receipt"</strong> (or take a screenshot of your transaction receipt).
                      </li>
                      <li>
                        <strong>Step 3:</strong> <strong>Upload that downloaded receipt below</strong> so our baristas can verify your payment and start brewing!
                      </li>
                    </ol>

                  <div style={{ marginTop: '0.7rem', background: 'rgba(239, 68, 68, 0.22)', border: '1px solid rgba(252, 165, 165, 0.7)', borderRadius: '10px', padding: '0.6rem 0.75rem', display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#fee2e2' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px', color: '#fecaca' }} />
                      <span style={{ fontSize: '0.76rem', lineHeight: 1.45 }}>
                        <strong style={{ color: '#fff' }}>Warning:</strong> Uploading a random image or a fake/invalid receipt will result in your <strong style={{ color: '#fff' }}>order being CANCELLED</strong>. Please upload your real GCash transaction receipt only.
                      </span>
                    </div>
                  </div>

                  {/* GCash Payment Receipt Upload (STRICTLY REQUIRED) */}
                  <div
                    id="gcash-receipt-upload-section"
                    style={{
                      background: !gcashReceiptImage ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      border: !gcashReceiptImage ? '1.5px solid rgba(248, 113, 113, 0.6)' : '1.5px solid rgba(52, 211, 153, 0.6)',
                      borderRadius: '12px',
                      padding: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontWeight: 800, fontSize: '0.84rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Receipt size={16} style={{ color: !gcashReceiptImage ? '#fca5a5' : '#6ee7b7' }} />
                        <span>Upload GCash Receipt</span>
                        <span style={{ color: '#f87171', fontSize: '1rem', fontWeight: 900 }}>*</span>
                      </label>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: !gcashReceiptImage ? '#ef4444' : '#10b981',
                        color: '#ffffff',
                        letterSpacing: '0.03em'
                      }}>
                        {!gcashReceiptImage ? 'REQUIRED' : 'RECEIPT ATTACHED ✓'}
                      </span>
                    </div>

                    {/* Inline Error Message */}
                    {gcashReceiptError && (
                      <div style={{
                        background: '#fef2f2',
                        border: '1.5px solid #f87171',
                        borderRadius: '8px',
                        padding: '0.65rem 0.75rem',
                        marginBottom: '0.65rem',
                        color: '#991b1b',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                        <span>{gcashReceiptError}</span>
                      </div>
                    )}

                    {/* Hidden Native File Input */}
                    <input
                      ref={receiptInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptFileChange}
                      style={{ display: 'none' }}
                      id="gcash-receipt-file-input"
                    />

                    {!gcashReceiptImage ? (
                      <div>
                        <div
                          onClick={() => receiptInputRef.current?.click()}
                          style={{
                            border: gcashReceiptError ? '2px dashed #f87171' : '2px dashed rgba(255, 255, 255, 0.7)',
                            background: gcashReceiptError ? 'rgba(239, 68, 68, 0.22)' : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '1.25rem 1rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.borderColor = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = gcashReceiptError ? 'rgba(239, 68, 68, 0.22)' : 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.borderColor = gcashReceiptError ? '#f87171' : 'rgba(255, 255, 255, 0.7)';
                          }}
                        >
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff'
                          }}>
                            <UploadCloud size={24} />
                          </div>
                          <div>
                            <div style={{ color: '#ffffff', fontWeight: 900, fontSize: '0.92rem', marginBottom: '2px' }}>
                              {isReceiptProcessing ? 'Processing Receipt Image...' : 'Click or Tap to Upload GCash Receipt'}
                            </div>
                            <div style={{ color: '#e0f2fe', fontSize: '0.74rem' }}>
                              Select your downloaded receipt or screenshot (JPG, PNG, WEBP)
                            </div>
                          </div>
                          <span style={{
                            background: '#ffffff',
                            color: '#0052cc',
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            padding: '4px 14px',
                            borderRadius: '20px',
                            marginTop: '3px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                          }}>
                            Choose Receipt File
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '7px', color: '#fef08a', fontSize: '0.73rem', fontWeight: 700 }}>
                          <AlertCircle size={14} style={{ color: '#fde047', flexShrink: 0 }} />
                          <span>Required: Please download your GCash transaction receipt and upload it to place your order.</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Attached Receipt Card */}
                        <div style={{
                          background: '#ffffff',
                          borderRadius: '10px',
                          padding: '0.65rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <div
                            onClick={() => setPreviewModalImage(gcashReceiptImage)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              cursor: 'pointer',
                              flex: 1,
                              minWidth: 0
                            }}
                            title="Click to zoom / view full receipt"
                          >
                            <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                              <img
                                src={gcashReceiptImage}
                                alt="GCash Receipt Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <Maximize2 size={12} />
                              </div>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {gcashReceiptFileName || 'GCash_Payment_Receipt.jpg'}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={11} />
                                <span>Receipt Attached ({gcashReceiptFileSize || 'Ready'})</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => setPreviewModalImage(gcashReceiptImage)}
                              style={{
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => receiptInputRef.current?.click()}
                              style={{
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveReceipt}
                              style={{
                                background: '#fef2f2',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', color: '#a7f3d0', fontSize: '0.73rem', fontWeight: 700 }}>
                          <CheckCircle2 size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                          <span>GCash receipt attached! Cashier will verify this proof upon receiving your order.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loyalty Points Redemption Checkbox Button */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="use-loyalty-points-cb"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: useLoyaltyPoints && canRedeemPoints ? '1.5px solid #FF5E00' : '1px solid #d1d5db',
                    background: useLoyaltyPoints && canRedeemPoints ? '#fff7ed' : '#f9fafb',
                    cursor: canRedeemPoints ? 'pointer' : (customer ? 'not-allowed' : 'pointer'),
                    boxShadow: useLoyaltyPoints && canRedeemPoints ? '0 2px 8px rgba(255, 94, 0, 0.12)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={(e) => {
                    if (!customer) {
                      e.preventDefault();
                      setIsAccountModalOpen(true);
                      return;
                    }
                    if (!canRedeemPoints) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <input
                      id="use-loyalty-points-cb"
                      type="checkbox"
                      checked={useLoyaltyPoints && canRedeemPoints}
                      disabled={!customer || !canRedeemPoints}
                      onChange={(e) => {
                        if (canRedeemPoints) {
                          setUseLoyaltyPoints(e.target.checked);
                        }
                      }}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#FF5E00',
                        cursor: canRedeemPoints ? 'pointer' : 'not-allowed'
                      }}
                    />
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1f2937', display: 'block' }}>
                        Use Loyalty Points {currentCustomerPoints}/100
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginTop: '1px' }}>
                        {canRedeemPoints ? (
                          <span style={{ color: '#059669', fontWeight: 600 }}>
                            ₱110 discount (1 free upsized drink) • Deducts 100 points ({currentCustomerPoints - 100} pts will remain in balance)
                          </span>
                        ) : customer ? (
                          <span>Every 100 pts = ₱110 discount (Need {100 - (currentCustomerPoints % 100)} more pts)</span>
                        ) : (
                          <span style={{ color: '#ea580c', fontWeight: 600 }}>Sign in to use your loyalty points</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {canRedeemPoints && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                      -₱110 OFF
                    </span>
                  )}
                </label>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#374151', marginBottom: '0.25rem' }}>Delivery Notes / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Call upon arrival, leave at desk..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>

              {/* Order Total Summary */}
              <div style={{ background: '#fdf8f3', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid #f3e8dc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>
                  <span>Items Subtotal</span>
                  <span>₱{cartSubtotal}</span>
                </div>
                {orderType === 'Delivery' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>
                    <span>Taytay Delivery Fee</span>
                    <span>₱45</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#059669', fontWeight: 700, marginBottom: '4px' }}>
                    <span>Loyalty Points Discount (100 Pts)</span>
                    <span>-₱{loyaltyDiscount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, color: '#2c1810', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e5e7eb' }}>
                  <span>Total Amount</span>
                  <span>₱{cartTotal}</span>
                </div>
                {customer && (
                  <span style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '4px', fontWeight: 600 }}>
                    <Gift size={14} /> You will earn +{Math.floor(cartTotal / 50) * 5} Loyalty Points for this order!
                  </span>
                )}
              </div>

              {/* GCash Receipt Notice if missing */}
              {paymentMethod === 'GCash' && !gcashReceiptImage && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '0.75rem 0.9rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.8rem',
                  color: '#991b1b',
                  lineHeight: '1.4'
                }}>
                  <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <div>
                    <strong>Payment Receipt Required:</strong> You cannot proceed & confirm without uploading your GCash Payment Receipt above.
                  </div>
                </div>
              )}

              {/* Terms & Conditions and Privacy Policy Acknowledgment */}
              <div style={{ fontSize: '0.74rem', color: '#64748b', textAlign: 'center', margin: '0.65rem 0 0.85rem', lineHeight: 1.45 }}>
                By placing this order, you acknowledge and agree to CommonBrew's{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('terms');
                    setShowLegalModal(true);
                  }}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#ea580c', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
                >
                  Terms and Conditions
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('privacy');
                    setShowLegalModal(true);
                  }}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#ea580c', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
                >
                  Privacy Policy
                </button>.
              </div>

              <button
                type="submit"
                disabled={orderPlacing || (paymentMethod === 'GCash' && !gcashReceiptImage)}
                style={{
                  width: '100%',
                  background: paymentMethod === 'GCash' 
                    ? (!gcashReceiptImage ? '#94a3b8' : '#007dfe')
                    : '#3d2314',
                  color: '#fff',
                  border: 'none',
                  padding: '0.95rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: (paymentMethod === 'GCash' && !gcashReceiptImage) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: paymentMethod === 'GCash' && gcashReceiptImage 
                    ? '0 4px 14px rgba(0, 125, 254, 0.35)' 
                    : 'none',
                  opacity: (paymentMethod === 'GCash' && !gcashReceiptImage) ? 0.8 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {paymentMethod === 'GCash' && <Smartphone size={18} />}
                <span>
                  {orderPlacing 
                    ? 'Placing Order...' 
                    : paymentMethod === 'GCash' 
                      ? (!gcashReceiptImage
                          ? `Upload GCash Receipt to Confirm (₱${cartTotal})`
                          : `Confirm & Place GCash Order (₱${cartTotal})`)
                      : `Confirm & Place Order (₱${cartTotal})`}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen QR View Modal */}
      {isQrModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.5rem',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: '#007dfe', color: '#fff', fontWeight: 900, fontSize: '0.8rem', padding: '3px 9px', borderRadius: '6px' }}>
                  GCash QR
                </span>
                <span style={{ fontWeight: 900, fontSize: '1rem', color: '#1e293b' }}>
                  CommonBrew Taytay
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
              display: 'inline-block',
              margin: '0 auto'
            }}>
              <img
                src={gcashQrImg}
                alt="Official GCash QR Code"
                referrerPolicy="no-referrer"
                style={{
                  width: '260px',
                  height: '260px',
                  aspectRatio: '1 / 1',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', fontSize: '0.82rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Account Name:</span>
                <strong style={{ color: '#0052cc' }}>JE*****H G.</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Mobile Number:</span>
                <strong style={{ color: '#1e293b' }}>09474960778</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Exact Amount:</span>
                <strong style={{ color: '#059669', fontSize: '0.95rem' }}>₱{cartTotal}</strong>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.75rem 0 0' }}>
              Take a screenshot or scan with your GCash app to complete payment.
            </p>
          </div>
        </div>
      )}

      {/* Full-Screen Receipt Preview Lightbox Modal */}
      {previewModalImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '1.25rem'
          }}
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.25rem',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007dfe' }}>
                  <Receipt size={17} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>GCash Payment Receipt</h4>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Proof of payment uploaded for this order</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: '1rem',
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: 'auto', textAlign: 'center', flex: 1, maxHeight: 'calc(92vh - 140px)', background: '#f8fafc', borderRadius: '12px', padding: '8px', border: '1px solid #e2e8f0' }}>
              <img
                src={previewModalImage}
                alt="GCash Payment Receipt Full Preview"
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} />
                <span>Verified Payment Proof</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                style={{
                  background: '#3d2314',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.55rem 1.2rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Account / Registration / Login Modal */}
      {isAccountModalOpen && !customer && (
        <AccessPortalModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          onCustomerLoginSuccess={(cust, token) => {
            const storedRegAddress = localStorage.getItem('commonbrew_reg_address') || '';
            const finalAddr = (cust.address || storedRegAddress || '').trim();
            if (!cust.address && finalAddr) {
              cust.address = finalAddr;
              const custToken = token || localStorage.getItem('commonbrew_customer_token');
              if (custToken) {
                fetch('/api/customer/update-profile', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-customer-token': custToken
                  },
                  body: JSON.stringify({ address: finalAddr, defaultAddress: finalAddr })
                }).catch(() => {});
              }
            }
            setCustomer(cust);
            setCustName(cust.fullName);
            setCustPhone(cust.phone || '');
            setCustEmail(cust.email || '');
            setDeliveryAddress(finalAddr);
            setAddressInput(finalAddr);
            setCustomerOrders([]);
            localStorage.setItem('commonbrew_customer', JSON.stringify(cust));
            setIsAccountModalOpen(false);
            fetchCustomerOrders(cust.id);
          }}
          onStaffLoginSuccess={(usr, token) => {
            if (token) localStorage.setItem('commonbrew_staff_token', token);
            if (onStaffLoginSuccess) {
              onStaffLoginSuccess(usr, token);
            } else {
              onSwitchToStaffLogin();
            }
            setIsAccountModalOpen(false);
          }}
          initialView={accountTab === 'register' ? 'register' : 'login'}
        />
      )}

      {isAccountModalOpen && customer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '540px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Account Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #3d2314 0%, #2c1810 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 10px rgba(234, 88, 12, 0.3)' }}>
                  <Coffee size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#fff' }}>
                    CommonBrew Account
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#f3e8dc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Logged in as <strong>{customer.fullName}</strong>
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { setIsAccountModalOpen(false); setIsEditingAddress(false); }} 
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Reorder Toast inside modal if any */}
            {reorderToast && (
              <div style={{ background: '#ecfdf5', color: '#065f46', padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #a7f3d0' }}>
                <CheckCircle2 size={16} /> {reorderToast}
              </div>
            )}

            {/* Account Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#faf5f0' }}>
              <button
                onClick={() => setAccountTab('profile')}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  border: 'none',
                  background: accountTab === 'profile' ? '#fff' : 'transparent',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  borderBottom: accountTab === 'profile' ? '3px solid #ea580c' : '3px solid transparent',
                  color: accountTab === 'profile' ? '#ea580c' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <UserIcon size={16} />
                <span>Profile & Loyalty</span>
              </button>
              <button
                onClick={() => {
                  setAccountTab('orders');
                  fetchCustomerOrders(customer.id);
                }}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  border: 'none',
                  background: accountTab === 'orders' ? '#fff' : 'transparent',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  borderBottom: accountTab === 'orders' ? '3px solid #ea580c' : '3px solid transparent',
                  color: accountTab === 'orders' ? '#ea580c' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <ShoppingBag size={16} />
                <span>Order History ({customerOrders.length})</span>
                {customerOrders.some(o => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready') && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              
              {/* PROFILE TAB */}
              {accountTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Customer Identity Card */}
                  <div style={{ background: '#fffcf9', borderRadius: '16px', padding: '1.25rem', border: '1px solid #ebd3bb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#3d2314', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 900 }}>
                        {customer.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CB'}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#2c1810' }}>{customer.fullName}</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                          @{customer.username} • <span style={{ color: '#4b5563' }}>{customer.email}</span>
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff', padding: '0.6rem 0.9rem', borderRadius: '14px', boxShadow: '0 4px 10px rgba(217, 119, 6, 0.25)', minWidth: '90px' }}>
                      <span style={{ fontSize: '1.35rem', fontWeight: 900, display: 'block', lineHeight: 1 }}>{customer.loyaltyPoints}</span>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em', opacity: 0.95 }}>Points</span>
                    </div>
                  </div>

                  {/* Loyalty Benefits Banner */}
                  <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #fcd34d', borderRadius: '14px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Gift size={22} color="#b45309" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.78rem', color: '#78350f', lineHeight: 1.4 }}>
                      <strong>CommonBrew Loyalty Member:</strong> You have <strong>{customer.loyaltyPoints} Points</strong> ({customer.loyaltyPoints >= 100 ? '🎉 Ready to redeem for ₱110 discount!' : `${100 - (customer.loyaltyPoints % 100)} more points to reach 100 pts`}). Earn 5 points per ₱50 spent on every purchase! Every 100 points = ₱110 discount (equivalent to 1 upsized drink).
                    </div>
                  </div>

                  {/* Contact & Delivery Details */}
                  <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '1rem', border: '1px solid #e5e7eb', fontSize: '0.85rem', color: '#374151' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#1f2937' }}>
                        <Phone size={15} color="#ea580c" /> Mobile Phone:
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                        {customer.phone || 'Not provided'}
                        {customer.phone && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <CheckCircle2 size={10} /> Verified
                          </span>
                        )}
                      </span>
                    </div>

                    <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEditingAddress ? '0.5rem' : '0' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#1f2937' }}>
                          <MapPin size={15} color="#ea580c" /> Default Delivery Address:
                        </span>
                        {!isEditingAddress && (
                          <button
                            onClick={() => {
                              setIsEditingAddress(true);
                              setAddressInput(customer.address || localStorage.getItem('commonbrew_reg_address') || '');
                            }}
                            style={{
                              background: '#fff',
                              border: '1px solid #fed7aa',
                              color: '#ea580c',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}
                          >
                            <Edit3 size={12} /> {customer.address ? 'Edit' : 'Add Address'}
                          </button>
                        )}
                      </div>

                      {isEditingAddress ? (
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                          <input
                            type="text"
                            value={addressInput}
                            onChange={(e) => setAddressInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveAddress();
                              }
                            }}
                            placeholder="Enter delivery address in Taytay..."
                            style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #ea580c', borderRadius: '8px', fontSize: '0.8rem', outline: 'none' }}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveAddress}
                            disabled={addressSaving}
                            style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {addressSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingAddress(false);
                              setAddressInput(customer.address || '');
                            }}
                            style={{ background: '#e5e7eb', color: '#4b5563', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginTop: '0.35rem', background: customer.address ? '#fff' : 'transparent', border: customer.address ? '1px solid #fed7aa' : 'none', padding: customer.address ? '0.5rem 0.75rem' : '0', borderRadius: '8px' }}>
                          <p style={{ margin: 0, fontSize: '0.84rem', color: customer.address ? '#1f2937' : '#9ca3af', fontWeight: customer.address ? 600 : 400, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {customer.address ? (
                              <>
                                <span style={{ color: '#ea580c' }}>📍</span>
                                <span>{customer.address}</span>
                              </>
                            ) : (
                              'No address set. Click Add Address to set your delivery address.'
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RECENT ORDER HISTORY SECTION (Directly inside Profile!) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={16} color="#ea580c" /> Recent Order History
                      </h4>
                      <button
                        onClick={() => { setAccountTab('orders'); fetchCustomerOrders(customer.id); }}
                        style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                      >
                        View All ({customerOrders.length}) <ChevronRight size={14} />
                      </button>
                    </div>

                    {customerOrders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.25rem', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db', color: '#6b7280', fontSize: '0.82rem' }}>
                        <Package size={24} style={{ margin: '0 auto 0.4rem', color: '#9ca3af' }} />
                        <p style={{ margin: 0, fontWeight: 600 }}>No past orders found.</p>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Your completed online and in-store orders will appear here!</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {customerOrders.slice(0, 2).map((order) => {
                          const statusBg = order.status === 'Completed' ? '#d1fae5' : order.status === 'Preparing' ? '#fef3c7' : order.status === 'Ready' ? '#dbeafe' : order.status === 'Cancelled' ? '#fee2e2' : '#f3f4f6';
                          const statusColor = order.status === 'Completed' ? '#065f46' : order.status === 'Preparing' ? '#92400e' : order.status === 'Ready' ? '#1e40af' : order.status === 'Cancelled' ? '#991b1b' : '#374151';

                          return (
                            <div key={order.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '0.9rem 1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ fontWeight: 800, color: '#3d2314', fontSize: '0.85rem' }}>#{order.orderRef}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#6b7280', background: '#f3f4f6', padding: '1px 6px', borderRadius: '6px', fontWeight: 600 }}>
                                      {order.orderType === 'Delivery' ? '🛵 Delivery' : order.orderType === 'Pickup' ? '🏬 Pickup' : '🍽️ Dine-in'}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'block', marginTop: '1px' }}>
                                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800, background: statusBg, color: statusColor }}>
                                  ● {order.status}
                                </span>
                              </div>

                              {order.status === 'Cancelled' && order.cancelReason && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.4rem 0.65rem', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 600, margin: '0.35rem 0' }}>
                                  Cancelled: {order.cancelReason}
                                </div>
                              )}

                              <div style={{ fontSize: '0.78rem', color: '#4b5563', margin: '0.4rem 0', padding: '0.35rem 0', borderTop: '1px dashed #f3f4f6', borderBottom: '1px dashed #f3f4f6' }}>
                                {order.items.map((it, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                                    <span>
                                      <strong>{it.quantity}x</strong> {it.productName}
                                      {it.isUpsize && <span style={{ fontSize: '0.68rem', color: '#ea580c', marginLeft: '4px', fontWeight: 700 }}>22oz</span>}
                                    </span>
                                    <span style={{ fontWeight: 600 }}>₱{it.subtotal}</span>
                                  </div>
                                ))}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#111827' }}>
                                  Total: ₱{order.totalAmount}
                                </span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button
                                    onClick={() => handleReorder(order)}
                                    style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                                  >
                                    <RotateCcw size={11} /> Reorder
                                  </button>
                                  <button
                                    onClick={() => { setAccountTab('orders'); setExpandedOrderId(order.id); }}
                                    style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Profile Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => { setAccountTab('orders'); fetchCustomerOrders(customer.id); }}
                      style={{ flex: 1, background: '#3d2314', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 4px 10px rgba(61, 35, 20, 0.2)' }}
                    >
                      <ShoppingBag size={16} /> View Full Order History ({customerOrders.length})
                    </button>
                    <button
                      onClick={handleCustomerLogout}
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.8rem 1rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* ORDERS TAB */}
              {accountTab === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Order Filter & Refresh Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', background: '#f3f4f6', padding: '3px', borderRadius: '10px', gap: '2px' }}>
                      <button
                        onClick={() => setOrderFilter('all')}
                        style={{ padding: '4px 10px', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: orderFilter === 'all' ? '#fff' : 'transparent', color: orderFilter === 'all' ? '#111827' : '#6b7280', boxShadow: orderFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                      >
                        All ({customerOrders.length})
                      </button>
                      <button
                        onClick={() => setOrderFilter('active')}
                        style={{ padding: '4px 10px', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: orderFilter === 'active' ? '#fff' : 'transparent', color: orderFilter === 'active' ? '#ea580c' : '#6b7280', boxShadow: orderFilter === 'active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                      >
                        Active ({customerOrders.filter(o => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready').length})
                      </button>
                      <button
                        onClick={() => setOrderFilter('completed')}
                        style={{ padding: '4px 10px', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: orderFilter === 'completed' ? '#fff' : 'transparent', color: orderFilter === 'completed' ? '#059669' : '#6b7280', boxShadow: orderFilter === 'completed' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                      >
                        Completed ({customerOrders.filter(o => o.status === 'Completed').length})
                      </button>
                    </div>

                    <button
                      onClick={() => fetchCustomerOrders(customer.id)}
                      disabled={ordersLoading}
                      style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#4b5563', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={12} className={ordersLoading ? 'animate-spin' : ''} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* Orders List Content */}
                  {customerOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#fffcf9', borderRadius: '16px', border: '1px dashed #ebd3bb', color: '#6b7280' }}>
                      <Coffee size={36} color="#d97706" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
                      <h4 style={{ margin: '0 0 0.25rem', color: '#2c1810', fontWeight: 800, fontSize: '1rem' }}>No orders placed yet</h4>
                      <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#6b7280' }}>Craving fresh artisanal coffee or warm pastries? Explore our menu and place your first order!</p>
                      <button
                        onClick={() => setIsAccountModalOpen(false)}
                        style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        Browse Menu Now
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {customerOrders
                        .filter(o => {
                          if (orderFilter === 'active') return o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready';
                          if (orderFilter === 'completed') return o.status === 'Completed';
                          return true;
                        })
                        .map(order => {
                          const isExpanded = expandedOrderId === order.id;
                          const statusBg = order.status === 'Completed' ? '#d1fae5' : order.status === 'Preparing' ? '#fef3c7' : order.status === 'Ready' ? '#dbeafe' : order.status === 'Cancelled' ? '#fee2e2' : '#f3f4f6';
                          const statusColor = order.status === 'Completed' ? '#065f46' : order.status === 'Preparing' ? '#92400e' : order.status === 'Ready' ? '#1e40af' : order.status === 'Cancelled' ? '#991b1b' : '#374151';

                          return (
                            <div key={order.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s' }}>
                              
                              {/* Order Card Top Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 900, color: '#3d2314', fontSize: '0.95rem' }}>#{order.orderRef}</span>
                                    <span style={{ fontSize: '0.72rem', color: '#fff', background: '#3d2314', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                                      {order.orderType === 'Delivery' ? '🛵 Delivery' : order.orderType === 'Pickup' ? '🏬 Pickup' : '🍽️ Dine-in'}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                                    {new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, background: statusBg, color: statusColor, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
                                    {order.status}
                                  </span>
                                </div>
                              </div>

                              {order.status === 'Cancelled' && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #dc2626', borderRadius: '10px', padding: '0.7rem 0.9rem', marginBottom: '0.85rem' }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                                    Reason for cancellation
                                  </div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7f1d1d' }}>
                                    {order.cancelReason || order.notes?.match(/\[Cancelled: ([^\]]+)\]/)?.[1] || 'Cancelled by the store.'}
                                  </div>
                                </div>
                              )}

                              {/* Live Order Progress Tracker Bar */}
                              <div style={{ background: '#faf5f0', borderRadius: '12px', padding: '0.75rem 0.85rem', marginBottom: '0.85rem', border: '1px solid #f3e8dc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '0.35rem' }}>
                                  {['Pending', 'Preparing', 'Ready', 'Completed'].map((step, idx) => {
                                    const stepIdx = ['Pending', 'Preparing', 'Ready', 'Completed'].indexOf(order.status);
                                    const isCompleted = stepIdx >= idx;
                                    const isCurrent = step === order.status;

                                    return (
                                      <div key={step} style={{ textAlign: 'center', zIndex: 2, flex: 1 }}>
                                        <div style={{
                                          width: '20px',
                                          height: '20px',
                                          borderRadius: '50%',
                                          background: isCompleted ? '#ea580c' : '#e5e7eb',
                                          color: '#fff',
                                          fontSize: '0.65rem',
                                          fontWeight: 800,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          margin: '0 auto 4px',
                                          boxShadow: isCurrent ? '0 0 0 3px rgba(234, 88, 12, 0.25)' : 'none'
                                        }}>
                                          {isCompleted ? '✓' : idx + 1}
                                        </div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: isCurrent ? 800 : 600, color: isCompleted ? '#3d2314' : '#9ca3af' }}>
                                          {step === 'Pending' ? 'Placed' : step === 'Preparing' ? 'Preparing' : step === 'Ready' ? (order.orderType === 'Delivery' ? 'Dispatched' : 'Ready') : 'Completed'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Ready / Dispatched Notification Banner */}
                              {order.status === 'Ready' && (
                                <div style={{
                                  background: order.orderType === 'Delivery' ? '#eff6ff' : '#f0fdf4',
                                  border: `1px solid ${order.orderType === 'Delivery' ? '#bfdbfe' : '#bbf7d0'}`,
                                  borderRadius: '10px',
                                  padding: '0.75rem 0.9rem',
                                  marginBottom: '0.85rem'
                                }}>
                                  <div style={{ fontWeight: 800, color: order.orderType === 'Delivery' ? '#1e40af' : '#15803d', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{order.orderType === 'Delivery' ? '🛵 Your order is on the way, please wait!' : '☕ Your order is ready!'}</span>
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '3px' }}>
                                    {order.orderType === 'Delivery'
                                      ? 'Our rider has picked up your order and is en route to your address. Please keep your phone reachable!'
                                      : 'Your drink is ready at CommonBrew Taytay counter. Show your order reference to pick up.'}
                                  </div>
                                  {order.deliveryEmailSent && (
                                    <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      ✉ Delivery notification email was sent to {order.deliveryEmailRecipient || order.customerEmail}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Item Breakdown List */}
                              <div style={{ fontSize: '0.82rem', color: '#374151', padding: '0.65rem 0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
                                {order.items.map((it, idx) => (
                                  <div key={idx} style={{ marginBottom: idx < order.items.length - 1 ? '0.65rem' : '0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                        <span style={{ fontWeight: 800, color: '#1f2937' }}>{it.quantity}x {it.productName}</span>
                                        {it.isUpsize && (
                                          <span style={{ marginLeft: '6px', fontSize: '0.7rem', fontWeight: 800, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa', padding: '1px 5px', borderRadius: '6px' }}>
                                            22oz
                                          </span>
                                        )}
                                      </div>
                                      <span style={{ fontWeight: 800, color: '#111827' }}>₱{it.subtotal}</span>
                                    </div>

                                    {/* Customization Details */}
                                    <div style={{ fontSize: '0.73rem', color: '#6b7280', marginTop: '2px', paddingLeft: '1rem', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                      {it.sugarLevel && <span>Sugar: {it.sugarLevel} •</span>}
                                      {it.iceLevel && <span>Ice: {it.iceLevel}</span>}
                                      {it.addons && it.addons.length > 0 && (
                                        <span style={{ color: '#b45309' }}>• Addons: {it.addons.join(', ')}</span>
                                      )}
                                      {it.specialInstructions && (
                                        <span style={{ color: '#9a3412', fontStyle: 'italic', display: 'block', width: '100%' }}>Note: "{it.specialInstructions}"</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Financial Summary & Delivery Info */}
                              <div style={{ padding: '0.65rem 0', fontSize: '0.8rem', color: '#4b5563' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                  <span>Subtotal:</span>
                                  <span>₱{order.subtotal}</span>
                                </div>
                                {order.deliveryFee > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span>Delivery Fee (Taytay):</span>
                                    <span>₱{order.deliveryFee}</span>
                                  </div>
                                )}
                                {Boolean(order.loyaltyDiscount && order.loyaltyDiscount > 0) && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: '#059669', fontWeight: 600 }}>
                                    <span>Loyalty Discount (100 pts):</span>
                                    <span>-₱{order.loyaltyDiscount}</span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #e5e7eb', fontWeight: 900, fontSize: '0.95rem', color: '#111827' }}>
                                  <span>Total Paid ({order.paymentMethod}):</span>
                                  <span style={{ color: '#ea580c' }}>₱{order.totalAmount}</span>
                                </div>

                                {order.paymentMethod === 'GCash' && (
                                  <div style={{ marginTop: '0.45rem', fontSize: '0.74rem', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '8px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Smartphone size={14} color="#007dfe" />
                                      <span><strong>GCash Account:</strong> 09474960778</span>
                                      {order.gcashReceiptImage ? (
                                        <span style={{ color: '#059669', fontWeight: 800 }}>• GCash Receipt Attached ✓</span>
                                      ) : (order.gcashReferenceNumber ? (
                                        <span>• <strong>Ref:</strong> {order.gcashReferenceNumber}</span>
                                      ) : null)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                      {order.gcashReceiptImage && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewModalImage(order.gcashReceiptImage!)}
                                          style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '3px 8px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                                        >
                                          <Receipt size={10} />
                                          <span>View Uploaded Receipt</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenGCashApp(order.totalAmount)}
                                        style={{ background: '#007dfe', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                                      >
                                        <Smartphone size={10} />
                                        <span>GCash App</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (navigator?.clipboard?.writeText) {
                                            navigator.clipboard.writeText('09474960778');
                                            alert('Copied GCash Account: 09474960778');
                                          }
                                        }}
                                        style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: '4px', padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                                      >
                                        Copy 09474960778
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {order.deliveryAddress && (
                                  <div style={{ marginTop: '0.5rem', fontSize: '0.73rem', color: '#6b7280', background: '#f9fafb', padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={12} color="#ea580c" />
                                    <span>Address: {order.deliveryAddress}</span>
                                  </div>
                                )}
                              </div>

                              {/* Order Action Buttons */}
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f3f4f6' }}>
                                <button
                                  onClick={() => handleReorder(order)}
                                  style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.65rem',
                                    borderRadius: '10px',
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.35rem',
                                    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)'
                                  }}
                                >
                                  <RotateCcw size={14} /> Reorder Items
                                </button>
                                
                                <button
                                  onClick={() => setSelectedReceiptOrder(order)}
                                  style={{
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: '1px solid #e5e7eb',
                                    padding: '0.65rem 1rem',
                                    borderRadius: '10px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}
                                >
                                  <Receipt size={14} /> Receipt
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Sign Out Link in Orders View */}
            {accountTab === 'orders' && (
              <div style={{ padding: '0.75rem 1.5rem', background: '#faf5f0', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {customerOrders.length} Total Orders Placed
                </span>
                <button
                  onClick={handleCustomerLogout}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {selectedReceiptOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '380px', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', fontFamily: 'monospace' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #d1d5db', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: '0 0 2px', fontWeight: 900, fontSize: '1.1rem', color: '#111' }}>COMMONBREW TAYTAY</h3>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#6b7280' }}>Specialty Coffee & Comfort Drinks</p>
              <p style={{ margin: 0, fontSize: '0.65rem', color: '#9ca3af' }}>Unit 7 Leoncio Commercial Bldg, Taytay, Rizal</p>
            </div>

            <div style={{ fontSize: '0.75rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              <div><strong>Order Ref:</strong> #{selectedReceiptOrder.orderRef}</div>
              <div><strong>Date:</strong> {new Date(selectedReceiptOrder.createdAt).toLocaleString()}</div>
              <div><strong>Customer:</strong> {selectedReceiptOrder.customerName}</div>
              <div><strong>Type:</strong> {selectedReceiptOrder.orderType} ({selectedReceiptOrder.paymentMethod})</div>
              {selectedReceiptOrder.deliveryAddress && <div><strong>Address:</strong> {selectedReceiptOrder.deliveryAddress}</div>}
            </div>

            <div style={{ borderTop: '1px dashed #d1d5db', borderBottom: '1px dashed #d1d5db', padding: '0.5rem 0', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
              {selectedReceiptOrder.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>{it.quantity}x {it.productName} {it.isUpsize ? '(22oz)' : ''}</span>
                  <span>₱{it.subtotal}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>₱{selectedReceiptOrder.subtotal}</span>
              </div>
              {selectedReceiptOrder.deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery Fee:</span>
                  <span>₱{selectedReceiptOrder.deliveryFee}</span>
                </div>
              )}
              {Boolean(selectedReceiptOrder.loyaltyDiscount && selectedReceiptOrder.loyaltyDiscount > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                  <span>Loyalty Discount (100 pts):</span>
                  <span>-₱{selectedReceiptOrder.loyaltyDiscount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 900, borderTop: '1px solid #111', paddingTop: '4px', marginTop: '4px' }}>
                <span>TOTAL:</span>
                <span>₱{selectedReceiptOrder.totalAmount}</span>
              </div>
            </div>

            {selectedReceiptOrder.paymentMethod === 'GCash' && (
              <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px', padding: '0.6rem', marginBottom: '0.75rem', fontSize: '0.72rem', color: '#1e40af' }}>
                <div style={{ fontWeight: 800, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Smartphone size={13} color="#007dfe" />
                  <span>GCash Payment Sent To:</span>
                </div>
                <div>Account: <strong>09474960778</strong> (CommonBrew Taytay)</div>
                {selectedReceiptOrder.gcashReceiptImage ? (
                  <div style={{ color: '#059669', fontWeight: 800, marginTop: '2px' }}>
                    Payment Proof: <strong>GCash Receipt Uploaded & Verified ✓</strong>
                  </div>
                ) : (selectedReceiptOrder.gcashReferenceNumber ? (
                  <div>Reference No: <strong>{selectedReceiptOrder.gcashReferenceNumber}</strong></div>
                ) : null)}
                {selectedReceiptOrder.gcashReceiptImage && (
                  <div style={{ marginTop: '5px' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewModalImage(selectedReceiptOrder.gcashReceiptImage!)}
                      style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '3px 8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Receipt size={11} />
                      <span>View Attached Payment Receipt</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#6b7280', marginBottom: '1rem' }}>
              Thank you for brewing memories with CommonBrew Taytay! ☕
            </div>

            <button
              onClick={() => setSelectedReceiptOrder(null)}
              style={{ width: '100%', background: '#3d2314', color: '#fff', border: 'none', padding: '0.7rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'sans-serif' }}
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Floating Customer AI Chatbot Button (Only visible when logged in) */}
      {customer && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 99,
            background: 'linear-gradient(135deg, #FF5E00 0%, #d97706 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '30px',
            padding: '0.75rem 1.25rem',
            fontWeight: 800,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 8px 24px rgba(255, 94, 0, 0.45)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Open CommonBot AI Assistant"
        >
          <img
            src="/commonbot-avatar.jpg"
            alt="CommonBot"
            referrerPolicy="no-referrer"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid #ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          />
          <span>Ask CommonBot AI</span>
        </button>
      )}

      {/* Customer Bot Drawer */}
      <CustomerBotDrawer
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        customer={customer}
      />

      {/* Cookie notice (shown until the visitor accepts) */}
      <CookieConsentBanner
        onLearnMore={() => {
          setLegalModalTab('privacy');
          setShowLegalModal(true);
        }}
      />

      {/* Terms and Conditions & Privacy Policy Legal Modal */}
      <LegalDocumentsModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        initialTab={legalModalTab}
      />
    </div>
  );
};
