export const getApplicableRewards = (offerData,bagTotal) => {
  if (!offerData || offerData.length === 0) return { applicable: [], discount: 0 };

  let applicable = [];
  let discountAmount = 0;

  offerData.forEach((reward) => {
    if (bagTotal >= reward.minOrderAmount) {
      applicable.push(reward);

      // apply only if discount type
      if (reward.giftType === "discount") {
        if (reward.discountPercentage) {
          discountAmount = (bagTotal * reward.discountPercentage) / 100;
        } else if (reward.discountAmount) {
          discountAmount = reward.discountAmount;
        }
      }
    }
  });

  return { applicable, discount: discountAmount };
};
