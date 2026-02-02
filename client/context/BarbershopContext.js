/**
 * BarbershopContext – tenant context for multi-shop owners.
 * Provides activeBarbershop, setActiveBarbershop, isOwner, myShops.
 * Persists active_barbershop_id in AsyncStorage and validates on load via my-shops API.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { setActiveBarbershopIdForApi } from '../services/api';
import { getActiveBarbershopId, setActiveBarbershopId as persistBarbershopId } from '../services/auth';

const BarbershopContext = createContext(null);

export function BarbershopProvider({ children }) {
  const [myShops, setMyShops] = useState([]);
  const [activeBarbershop, setActiveBarbershopState] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMyShops = useCallback(async () => {
    try {
      const { data } = await api.get('/barbershops/my-shops/');
      const list = data.barbershops || [];
      setMyShops(list);
      return list;
    } catch (e) {
      if (e.response?.status === 401) {
        setMyShops([]);
        return [];
      }
      setMyShops([]);
      return [];
    }
  }, []);

  const setActiveBarbershop = useCallback(async (id) => {
    if (id == null) {
      await persistBarbershopId(null);
      setActiveBarbershopState(null);
      setActiveBarbershopIdForApi(null);
      return;
    }
    const shop = myShops.find((s) => Number(s.id) === Number(id));
    if (shop) {
      await persistBarbershopId(String(shop.id));
      setActiveBarbershopState(shop);
      setActiveBarbershopIdForApi(String(shop.id));
    } else {
      await persistBarbershopId(String(id));
      setActiveBarbershopState({ id: Number(id) });
      setActiveBarbershopIdForApi(String(id));
    }
  }, [myShops]);

  const restoreContext = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setMyShops([]);
        setActiveBarbershopState(null);
        setActiveBarbershopIdForApi(null);
        setLoading(false);
        return;
      }
      const list = await loadMyShops();
      const storedId = await getActiveBarbershopId();
      if (storedId && list.length) {
        const found = list.find((s) => String(s.id) === String(storedId));
        if (found) {
          setActiveBarbershopState(found);
          setActiveBarbershopIdForApi(String(found.id));
        } else {
          await persistBarbershopId(null);
          setActiveBarbershopState(null);
          setActiveBarbershopIdForApi(null);
        }
      } else if (list.length === 1) {
        setActiveBarbershopState(list[0]);
        setActiveBarbershopIdForApi(String(list[0].id));
        await persistBarbershopId(String(list[0].id));
      } else {
        setActiveBarbershopState(null);
        setActiveBarbershopIdForApi(null);
      }
    } catch (e) {
      setActiveBarbershopState(null);
      setActiveBarbershopIdForApi(null);
    } finally {
      setLoading(false);
    }
  }, [loadMyShops]);

  useEffect(() => {
    restoreContext();
  }, [restoreContext]);

  const isOwner = !!(
    activeBarbershop &&
    (activeBarbershop.owner_role === 'Admin' ||
      myShops.some((s) => Number(s.id) === Number(activeBarbershop.id) && s.owner_role === 'Admin'))
  );

  /** userRole: 'customer' | 'barber' | 'admin' | 'owner' from active shop staff role. */
  const userRole = (() => {
    if (!activeBarbershop) return 'customer';
    if (isOwner) return 'owner';
    const role = activeBarbershop.owner_role;
    if (role === 'Admin') return 'admin';
    if (role === 'Barber') return 'barber';
    return 'customer';
  })();

  const value = {
    activeBarbershop,
    setActiveBarbershop,
    myShops,
    loadMyShops,
    isOwner,
    userRole,
    loading,
    restoreContext,
  };

  return (
    <BarbershopContext.Provider value={value}>
      {children}
    </BarbershopContext.Provider>
  );
}

export function useBarbershop() {
  const ctx = useContext(BarbershopContext);
  if (!ctx) {
    throw new Error('useBarbershop must be used within BarbershopProvider');
  }
  return ctx;
}

export default BarbershopContext;
