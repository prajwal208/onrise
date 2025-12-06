import React, { useEffect, useState } from 'react'
import styles from './pricelist.module.scss'
import { getApplicableRewards } from '@/lib/price';

const PriceList = ({ bagTotal, grandTotal, handlePayNow, offerData }) => {
  
  const { applicable, discount } = getApplicableRewards(offerData,bagTotal);
  const finalPayable = (grandTotal - discount).toFixed(2);

  return (
    <div className={styles.priceDetails}>
      <div className={styles.priceHeader}>
        <h2>Order Details</h2>
      </div>

      <div className={styles.priceContent}>
        
        <div className={styles.priceRow}>
          <span>Bag Total</span>
          <span className={styles.priceValue}>₹{bagTotal}</span>
        </div>

        <div className={styles.priceRow}>
          <span>Shipping</span>
          <span>₹50</span>
        </div>

        {discount > 0 && (
          <div className={`${styles.priceRow} ${styles.discountRow}`}>
            <span>Gift Reward Discount</span>
            <span>- ₹{discount.toFixed(2)}</span>
          </div>
        )}

        <div className={styles.grandTotalRow}>
          <span>Final Payable</span>
          <span className={discount > 0 ? styles.strikeValue : ""}>
            ₹{grandTotal}
          </span>
        </div>

        {discount > 0 && (
          <div className={styles.finalAmount}>
            <span>Final Payable after Gift</span>
            <strong>₹{finalPayable}</strong>
          </div>
        )}

        {applicable.length > 0 && (
          <div className={styles.rewardsApplied}>
            {applicable.map((reward) => (
              <p key={reward.id} className={styles.rewardRow}>
                {reward.title}
              </p>
            ))}
          </div>
        )}

        <button
          className={styles.payBtn}
          onClick={handlePayNow}
        >
          PAY ₹{finalPayable}
        </button>
      </div>
    </div>
  );
};


export default PriceList
