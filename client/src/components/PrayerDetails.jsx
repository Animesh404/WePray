import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "./Navbar";
import PrayerCard from "./shared/PrayerCard";
import MessageCard from "./shared/MessageCard";
import api from "../utils/axios";

const PrayerDetails = () => {
  const { id } = useParams();
  // console.log(id);
  const [prayer, setPrayer] = useState(null);
  const [messages, setMessages] = useState([]);
  const { user, isSubscribed } = useAuth();
  const [messageForm, setMessageForm] = useState({
    prayer_id: id,
    user_id: user?.id || null,
    content: "",
  });
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/messages", messageForm);
      console.log("API Response:", response.data);
      setMessageForm({
        prayer_id: id,
        user_id: user.id || null,
        content: "",
      });
      fetchDashboardData();
    } catch (error) {
      console.log("Failed to send message", error);
    }
  };
  const handleChange = (e) => {
    setMessageForm({
      ...messageForm,
      [e.target.name]: e.target.value,
    });
  };
  const fetchDashboardData = async () => {
    try {
      const prayersRes = await api.get(`/prayers/${id}`);

      // Log the response to ensure you're getting the correct data
      // console.log("API Response:", prayersRes.data);
      const messageRes = isSubscribed? await api.get(`/messages/${id}`):null;

      // console.log(messageRes.data.data.messages);
      messageRes && messageRes.data.data.messages.length > 0 ? setMessages(messageRes.data.data.messages) : setMessages([]);

      const fetchedPrayer = prayersRes.data?.data;
      // console.log("fetched prayer:", fetchedPrayer);
      setPrayer(fetchedPrayer);
      // console.log(prayer.pray_count);
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
      <div className="max-w-4xl mt-16 md:mt-36 mx-auto p-2 flex flex-col items-center justify-center">
        <PrayerCard
          createdAt={prayer.created_at}
          prayerCount={parseInt(prayer.pray_count, 10)}
          userName={prayer.name}
          country={prayer.country}
          categories={prayer.categories}
          content={prayer.message}
          prayerID={prayer.id}
          userId={prayer.user_id}
          type={prayer.type}
          // parseInt(prayer.pray_count + 1, 10))}
        />
        {(isSubscribed && prayer.user_id) && (
          <span className="w-full text-gray-400  items-center text-xl font-medium flex itmes-center justify-center">
          Messages
        </span>
        )
      }
        {(!isSubscribed && prayer.user_id) &&
        (<button
          type="submit"
          onClick={() => user ? window.location.replace("/#subscription") : window.location.replace("/login")}
          className="w-md flex justify-center m-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#409F9C] hover:bg-[#368B88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#409F9C]"
        >
          Subscribe to view or send messages
        </button>)}
        
        <div className="w-full flex flex-col items-center justify-center p-10">
          {(isSubscribed && prayer.type === 'prayer') && (
            <div className="w-full flex flex-col items-center justify-center">
            <form
              className="w-full flex flex-row items-center justify-center"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                id="message"
                name="content"
                value={messageForm.content}
                placeholder="send message"
                onChange={handleChange}
                className="mt-1 py-1 px-1 block w-full rounded-md bg-white border-2 border-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="w-md flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#409F9C] hover:bg-[#368B88] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#409F9C]"
              >
                Send
              </button>
            </form>
          </div>
          )}
          
          {messages && messages.length > 0 && (
              <div className="w-full flex flex-col items-center justify-center">
            
              {messages.map((message) => (
                <MessageCard
                  key={message.id}
                  content={message.content}
                  userName={message.user_name}
                  createdAt={message.created_at}
                />
              ))}
          </div>
            )}
          
      </div>
    </div>
  </>
  );
};

export default PrayerDetails;
