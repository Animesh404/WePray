import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "./Navbar";
import PrayerCard from "./shared/PrayerCard";
import api from "../utils/axios";

const PrayerDetails = () => {
  const { id } = useParams();
  console.log(id);
  const [prayer, setPrayer] = useState(null);
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const prayersRes = await api.get(`/prayers/${id}`);

      // Log the response to ensure you're getting the correct data
      console.log("API Response:", prayersRes.data);

      const fetchedPrayer = prayersRes.data?.data;
      console.log("fetched prayer:", fetchedPrayer);
      setPrayer(fetchedPrayer);
      console.log(prayer.pray_count);
    } catch (error) {
      console.log("Failed to fetch prayer data", error);
    }
  };
  if (!prayer) {
    return (
      <>
        <Navbar />
      </>
    );
  }
  return (
    <>
      <Navbar />
      <div className="max-w-4xl mt-16 mx-auto p-2">
        <PrayerCard
          createdAt={prayer.created_at}
          prayerCount={parseInt(prayer.pray_count, 10)}
          userName={prayer.name}
          country={prayer.country}
          categories={prayer.categories}
          content={prayer.message}
          prayerID={prayer.id}
          type={prayer.type}
          // parseInt(prayer.pray_count + 1, 10))}
        />
      </div>
    </>
  );
};

export default PrayerDetails;
