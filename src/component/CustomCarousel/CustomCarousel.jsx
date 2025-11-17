"use client";

import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import Image from "next/image";
import axios from "axios";
import styles from "./carousel.module.scss";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const CustomCarousel = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [banners, setBanners] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false); // 👈 ensure client render

  useEffect(() => {
    setMounted(true); // only true on client

    const getImage = async () => {
      try {
        const res = await axios.get(`${apiUrl}/v1/categories/banners`, {
          headers: {
            "x-api-key":
              "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          },
        });
        const all = res?.data?.data?.flatMap((b) => b?.banners || []);
        setBanners(all);
      } catch (err) {
        console.error("Error fetching banner images:", err);
      }
    };

    getImage();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Desktop / marquee slider
  const desktopSettings = {
    dots: false,
    infinite: true,
    speed: 7000,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    pauseOnHover: false,
    arrows: false,
  };

  // Mobile slider
  const mobileSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    cssEase: "ease",
    arrows: true,
  };

  if (!mounted || banners.length === 0) return null; // 👈 wait for client + banners

  return (
    <main className={styles.carousel_main_wrap}>
      <Slider {...(isMobile ? mobileSettings : desktopSettings)}>
        {banners.map((item, i) => (
          <div key={i} className={styles.banner_item}>
            <Image
              src={item.imageUrl}
              alt={`banner-${i}`}
              width={800}
              height={600}
              className={styles.banner_image}
              priority
            />
          </div>
        ))}
      </Slider>
    </main>
  );
};

export default CustomCarousel;
