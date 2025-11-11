"use client";

import React, { useEffect, useState } from "react";
import styles from "./categotyGrid.module.scss";
import tshirt from "@/assessts/shirt.jpeg";
import shirt from "@/assessts/shirt.jpeg";
import CategoryCard from "@/component/CategoryCard/CategoryCard";
import axios from "axios";
import { useRouter } from "next/navigation";


const CategoryGrid = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [categories,setCategories] = useState([])
  const router = useRouter();

  const getData = async () => {
    const res = await axios.get(`${apiUrl}/v1/categories/all`,{
       headers: {
        "x-api-key":
          "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
      },
    });
    setCategories(res?.data?.data?.[0].collections)
    console.log(res?.data?.data?.[0].collections, "sjsjshyyy");
  };

  useEffect(() => {
    getData();
  }, []);

  const handleCardClick = (id) => {
    router.push(`/selectedcategory/${id}`);
  };

  return (
    <main className={styles.featured_categories}>
      <h3>FEATURED CATEGORIES</h3>
      <section className={styles.gridWrapper}>
        {categories.map((item) => (
          <div onClick={() => {handleCardClick(item?.id)}}>
            <CategoryCard key={item.id} image={item.image} title={item.name} />
          </div>
        ))}
      </section>
    </main>
  );
};

export default CategoryGrid;
