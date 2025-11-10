"use client";
import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import styles from "./cart.module.scss";
import axios from "axios";
import api from "@/axiosInstance/axiosInstance";
import NoResult from "@/component/NoResult/NoResult";
import { useRouter } from "next/navigation";
import CartRewards from "./CartRewards/CartRewards";

const Cart = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [cartItems, setCartItems] = useState([]);
  const router = useRouter();

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price =
        Number(item.price) ||
        Number(item.totalPrice) ||
        Number(item.product?.price) ||
        0;
      const qty = Number(item.quantity) || 1;
      return sum + price * qty;
    }, 0);
  };

  const bagTotal = calculateTotal();
  const couponDiscount = 0;
  const grandTotal = bagTotal - couponDiscount;

  const getCartData = async () => {
    try {
      const res = await api.get(`${apiUrl}/v1/cart`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      console.log(res.data.data, "🧾 Cart API Response");
      setCartItems(res?.data?.data || []);
    } catch (error) {
      console.error("❌ Error fetching cart:", error);
    }
  };

  useEffect(() => {
    getCartData();
  }, []);

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/v1/cart?itemid=${id}`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.cartPage}>
      {cartItems?.length > 0 ? (
        <>
          <CartRewards totalAmount={bagTotal} />
          <div className={styles.cartContainer}>
            <div className={styles.cartItems}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemImage}>
                    <img src={item.imageUrl} alt={item.name} />
                  </div>

                  <div className={styles.itemDetails}>
                    <div>
                      <div className={styles.itemHeader}>
                        <h3 className={styles.itemName}>{item.name}</h3>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className={styles.removeBtn}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className={styles.itemMeta}>
                        <span>
                          {item.options?.size} | {item.options?.color}
                        </span>
                        <span className={styles.quantitySelector}>
                          QTY |
                          <select
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.id,
                                parseInt(e.target.value)
                              )
                            }
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                        </span>
                      </div>
                    </div>

                    <div className={styles.itemFooter}>
                      <button className={styles.wishlistBtn}>
                        MOVE TO WISHLIST
                      </button>
                      <span className={styles.itemPrice}>
                        ₹
                        {item.price ||
                          item.totalPrice ||
                          item.product?.price ||
                          0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Details Section */}
            <div className={styles.priceDetails}>
              <div className={styles.priceHeader}>
                <h2>Price Details</h2>
              </div>

              <div className={styles.priceContent}>
                <div className={styles.priceRow}>
                  <span>Bag Total</span>
                  <span className={styles.priceValue}>₹{bagTotal}</span>
                </div>

                <div className={styles.priceRow}>
                  <span>Shipping</span>
                  <span className={styles.priceValue}>₹0</span>
                </div>

                <div className={styles.grandTotalRow}>
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>

                <button className={styles.payBtn}>PAY ₹ {grandTotal}</button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <NoResult
          title={"OOps! Your Cart is Empty"}
          description={
            "It seems like your shopping cart is currently empty. Start adding items to your cart to continue shooping and enjoy a seamless checkout experience. Explore our product and find the perfect items for you"
          }
          buttonText={"Explore"}
          onButtonClick={() => router.push("/")}
        />
      )}
    </div>
  );
};

export default Cart;
