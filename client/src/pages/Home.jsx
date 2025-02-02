import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import "../App.css";
import StripeButton from "../components/shared/StripeButton";
import logo from "../assets/logo.png";
import heroImg from "../assets/heroImg.png";
import howImg from "../assets/how.png";
import star from "../assets/star.png";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";
import api from "../utils/axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // const navigate = useNavigate();

  const [prayerCount, setPrayerCount] = useState(0);
  const [praiseCount, setPraiseCount] = useState(0);
  const [subButtonText, setSubButtonText] = useState("Active");
  const [endsAt, setEndsAt] = useState("");
  const { user, isSubscribed } = useAuth();
  const location = useLocation();
  const emailShare = () => {
    const subject = "Custom Subscription Plan";
    const body =
      "I would like to inquire about the custom subscription plan for my organization.";
    const mailtoUrl = `mailto:info@wipray.com 
?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };
  useEffect(() => {
    fetchPrayerData();
  }, []);
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  const fetchPrayerData = async () => {
    try {
      // Fetch prayer count
      const prayersResponse = await api.get("/prayers/approvedPrayers");
      const praisesResponse = await api.get("/prayers/approvedPraises");
      if (user) {
        const subStatus = await api.get("/subscription/subStatus");
        if (subStatus.data.subscription.status === "canceled") {
          const endsat = new Date(
            subStatus.data.subscription.expires_at
          ).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
          setEndsAt(endsat);
        }
      }

      const fetchedPrayerCount = prayersResponse.data?.data?.total_pray_count || 0;
      // console.log(prayersResponse.data?.data?.);
      const fetchedPraiseCount = praisesResponse.data?.data?.total || 0;

      setPrayerCount(fetchedPrayerCount);
      setPraiseCount(fetchedPraiseCount);
    } catch (error) {
      console.error("Error fetching prayer data:", error);
    }
  };

  const handleCancelSub = async () => {
    try {
      await api.post("/subscription/cancel", user.id);
      setSubButtonText("Cancelled");
      fetchPrayerData();
    } catch (error) {
      console.log(error);
    }
  };

  const testimonials = [
    {
      name: "Veronica Johnsen",
      image:
        "https://media.istockphoto.com/id/1223671392/vector/default-profile-picture-avatar-photo-placeholder-vector-illustration.jpg?s=612x612&w=0&k=20&c=s0aTdmT5aU6b8ot7VKm11DeID6NctRCpB755rA1BIP0=",
      text: "I praise God for this Last Generation of youth. I praise Him for their energy, creativity, but most of all that they love God. I praise Him for the work this Last Generation is doing in the fields ripe for the picking. It was the past generations that sowed, now this Last Generation is finishing the harvest. I praise God for this Last Generation! Soon we will be gathered together celebrating Christs victory for our souls. I praise God for Wipray too! What wonderful vision God gives each generation but this Last Generation excels them all.",
    },
    {
      name: "C G",
      image:
        "https://media.istockphoto.com/id/1223671392/vector/default-profile-picture-avatar-photo-placeholder-vector-illustration.jpg?s=612x612&w=0&k=20&c=s0aTdmT5aU6b8ot7VKm11DeID6NctRCpB755rA1BIP0=",
      text: "Praising God for WiPray! Beautiful idea that will reap rewards, giving all glory to God!",
    },
  ];

  return (
    <div>
      <Navbar />

      {isDrawerOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      <div className="hero-section">
        <div className="hero-left">
          <div className="content">
            <div className="mask">
              <h1 className="anim">Where God's People Unite in Prayer</h1>
            </div>
            <div className="mask">
              <p className="anim">
                WiPray platform provides a space for individuals to share their
                prayer requests and praises, inviting others to join in prayer
                or celebrate moments of gratitude.
              </p>
            </div>
            <div className="flex">
              <div className="cta">
                <Link to="/comingSoon">Join a Prayer Community.</Link>
              </div>
              <div className="cta">
                <Link to="/prayerWall">Start Praying Today.</Link>
              </div>
            </div>
          </div>

          <div className="numbers mask">
            <div className="number anim">
              <h3>{prayerCount.toLocaleString()}</h3>Prayers Prayed
            </div>
            <div className="number anim">
              <h3>{praiseCount.toLocaleString()}</h3>Praise Submitted
            </div>
          </div>
        </div>
        <img src={heroImg} className="leftAnim" alt="Hero" />
        <div className="circle"></div>
      </div>

      <hr />

      <div className="about-section">
        <h1>About Us</h1>
        <p id="paragraph">
          At WiPray, we believe in the transformative power of prayer and the
          strength of a faith-driven community. Our platform allows individuals
          to share prayer requests and praises, inviting others to join in
          prayer or celebrate moments of gratitude. Whether you're seeking
          prayers or offering them to others, PrayerCircle brings believers
          together to support one another in faith. We aim to connect those in
          need of spiritual encouragement, fostering a space where everyone
          feels heard, uplifted, and united through prayer, as we strengthen our
          relationship with God through meaningful, heartfelt communion.
        </p>
      </div>

      <div className="tv-section animText1">
        <h1>PRAYER TV SHOWS</h1>
        <div className="show-container">
          {/* {[
            "Karma or Putting others First", 
            "Beautiful Through Christ", 
            "Karma or Putting others First"
          ].map((title, index) => (
            <div className="card" key={index}>
              <img src={tv1} alt="" />
              <div className="card-detail">
                <h2>{title}</h2>
                <svg width="55" height="55" viewBox="0 0 71 71" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clip-path="url(#clip0_11_14)">
                    <path d="M35.5 0C44.9152 0 53.9448 3.74017 60.6023 10.3977C67.2598 17.0553 71 26.0848 71 35.5C71 44.9152 67.2598 53.9448 60.6023 60.6023C53.9448 67.2598 44.9152 71 35.5 71C26.0848 71 17.0553 67.2598 10.3977 60.6023C3.74017 53.9448 0 44.9152 0 35.5C0 26.0848 3.74017 17.0553 10.3977 10.3977C17.0553 3.74017 26.0848 0 35.5 0ZM6.65625 35.5C6.65625 43.1498 9.69514 50.4864 15.1044 55.8956C20.5136 61.3049 27.8502 64.3438 35.5 64.3438C43.1498 64.3438 50.4864 61.3049 55.8956 55.8956C61.3049 50.4864 64.3438 43.1498 64.3438 35.5C64.3438 27.8502 61.3049 20.5136 55.8956 15.1044C50.4864 9.69514 43.1498 6.65625 35.5 6.65625C27.8502 6.65625 20.5136 9.69514 15.1044 15.1044C9.69514 20.5136 6.65625 27.8502 6.65625 35.5ZM28.3068 23.1948L47.2283 34.5504C47.3918 34.6491 47.5271 34.7884 47.621 34.9548C47.7148 35.1212 47.7642 35.309 47.7642 35.5C47.7642 35.691 47.7148 35.8788 47.621 36.0452C47.5271 36.2116 47.3918 36.3509 47.2283 36.4496L28.3068 47.8052C28.1386 47.9065 27.9464 47.9614 27.75 47.9642C27.5536 47.9669 27.36 47.9175 27.1889 47.8209C27.0179 47.7243 26.8755 47.5841 26.7765 47.4145C26.6774 47.2449 26.6251 47.052 26.625 46.8556V24.1489C26.6243 23.9521 26.676 23.7586 26.7748 23.5884C26.8735 23.4182 27.0158 23.2773 27.187 23.1802C27.3582 23.0831 27.5521 23.0332 27.7489 23.0358C27.9457 23.0384 28.1382 23.0933 28.3068 23.1948Z" fill="white" />
                  </g>
                  <defs>
                    <clipPath id="clip0_11_14">
                      <rect width="71" height="71" fill="white" />
                    </clipPath>
                  </defs>
                </svg>

              </div>
            </div>
          ))} */}

          <iframe
            width="560"
            height="250"
            src="https://www.youtube.com/embed/kHtZUe6fg6s?si=ywH_lC_ZyrpRNg8r"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
          <iframe
            width="560"
            height="250"
            src="https://www.youtube.com/embed/-AvMtqUbxys?si=MC1F-hcIoMnh-T_c"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
          <iframe
            width="560"
            height="250"
            src="https://www.youtube.com/embed/gmwQQyvN8H4?si=f6dAR2jSoJagTDPL"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      </div>

      <div className="how-section">
        <div className="how-left">
          <h1>How it works</h1>
          <p>Three Simple Steps to Connect, Pray, and Uplift Others in Faith</p>
          <h2>Bible Say's</h2>
          <p>For where two or three gather in my name, there am I with them.</p>
          <hr />
          <p>Matthew 18:20</p>
        </div>
        <div className="how-right">
          <img src={howImg} alt="" />
        </div>
        <div className="circle2"></div>
      </div>

      <hr />

      <div className="how-section affilate-section">
        <div className="how-left">
          <h1>Become an Affiliate</h1>
          <h2>Share Faith, Earn Rewards</h2>
          <br />
          <p>
            At WiPray, we believe in spreading the power of prayer far and wide.
            By joining our affiliate program, you can help grow our
            compassionate community while earning rewards. As a WiPray
            affiliate, you'll have the opportunity to share the platform with
            your network and inspire others to connect, pray, and uplift one
            another.
          </p>
        </div>
        <div className="how-right"></div>
        <div className="circle2"></div>
      </div>

      {/* <div className="event-section">
        <h1>UPCOMING PRAYER CALLS</h1>
        {[...Array(4)].map((_, index) => (
          <div className="event-item" key={index} data-cursor-img="https://cf1.gatewaypeople.com/production/fae/image/asset/6441/gatewayworship_webbanner.jpg">
            <div className="date">
              <h3>20 OCT</h3>
            </div>
            <div>
              <h3 className="event-name">Service of Celebration</h3>
              <p>Sunday, 8:00 AM to 9:30 AM</p>
            </div>
          </div>
        ))}
      </div> */}
      <div
        
        className="subscription-section bg-[#B4D4D3] py-16 px-4 md:px-8 lg:px-16 rounded-3xl mx-4 md:mx-8 lg:mx-16 my-16 flex flex-col items-center"
      >
        <div className="text-center mb-12" id="subscription">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">
            Subscription Plan
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto relative z-10">
            Take your spiritual journey to the next level with our subscription
            plans.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Standard Plan */}
          {!isSubscribed && (
            <div className="bg-white p-8 rounded-3xl flex flex-1 flex-col h-full">
              <h2 className="text-2xl font-bold mb-4">Standard Plan</h2>
              <p className="text-gray-600 mb-6">
                Perfect for individuals who want to actively engage in a
                supportive prayer community.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">Free</span>
                {/* <p className="text-gray-400">Pause or cancel anytime</p> */}
              </div>
              <button className="bg-[#B4D4D3] text-black font-semibold py-3 px-6 rounded-full mb-8">
                Active
              </button>
              <ul className="space-y-4">
                <li className="flex">
                  <div className="w-7 shrink-0">
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="flex-1">Post Prayer Requests</span>
                </li>
                <li className="flex">
                  <div className="w-7 shrink-0">
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="flex-1">Join global prayer community</span>
                </li>
                <li className="flex">
                  <div className="w-7 shrink-0">
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="flex-1">Receive Prayer Notifications</span>
                </li>
                <li className="flex">
                  <div className="w-7 shrink-0">
                    <svg
                      className="w-5 h-5 text-teal-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="flex-1">Optimized for mobile</span>
                </li>
              </ul>
            </div>
          )}

          {/* Premium Plan */}

          <div className="bg-white p-8 rounded-3xl flex flex-1 flex-col h-full">
            <h2 className="text-2xl font-bold mb-4 relative z-10">
              Premium Plan
            </h2>
            <p className="text-gray-600 mb-6 relative z-10">
              Ideal for those seeking deeper engagement and exclusive privileges
              within the community.
            </p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$39/m</span>
              {/* <p className="text-gray-400">Pause or cancel anytime</p> */}
            </div>
            <>
              {!isSubscribed ? (
                <StripeButton />
              ) : (
                <div className="flex flex-col">
                  <button className="bg-[#B4D4D3]/40 text-black font-semibold py-3 px-6 rounded-full mb-1 cursor-not-allowed">
                    {subButtonText}
                  </button>
                  {/* <button
                    className={`font-semibold py-3 px-6 rounded-full mb-8 ${
                      endsAt !== ""
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-[#409F9C] text-white cursor-pointer"
                    }`}
                    onClick={handleCancelSub}s
                    disabled={endsAt !== ""}
                  >
                    {endsAt !== ""
                      ? `Subscription ends on ${endsAt}`
                      : "Cancel"}
                  </button> */}
                </div>
              )}
            </>

            <ul className="space-y-4">
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Everything in the Free Plan, plus:
              </li>
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Access to exclusive private prayer groups—join or create your
                own.
              </li>
              {/* Add other premium features */}
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Receive personalized Bible promises tailored to uplift and
                inspire.
              </li>
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Stay spiritually enriched with daily prayer devotionals.
              </li>
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Gain insights with an advanced analytics dashboard.
              </li>
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Receive private messages of encouragement from fellow users.
              </li>
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Manage your prayer experience by editing or deleting prayer
                requests and praises.
              </li>
            </ul>
          </div>

          {/* Organization Plan */}
          <div className="bg-white p-8 rounded-3xl flex flex-1 flex-col h-full">
            <h2 className="text-2xl font-bold mb-4 relative z-10">
              Organization Plan
            </h2>
            <p className="text-gray-600 mb-6 relative z-10">
              Tailored for churches, ministries, or faith-based organizations to
              manage collective prayer efforts.
            </p>
            <div className="mb-6">
              <span className="text-3xl font-bold">Custom Pricing</span>
              {/* <p className="text-gray-400">Pause or cancel anytime</p> */}
            </div>
            <button
              className="bg-[#409F9C] text-white font-semibold py-3 px-6 rounded-full mb-8"
              onClick={emailShare}
            >
              Contact Admin
            </button>
            <ul className="space-y-4">
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Host your own prayer wall directly on your website.
              </li>
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Enjoy full customization and branding options, including logos,
                colors, and fonts.
              </li>
              {/* Add other organization features */}
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Access detailed insights with analytics tools.
              </li>
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Ensure a safe and respectful environment with moderation
                features.
              </li>
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Benefit from dedicated tech support to keep everything running
                smoothly.
              </li>
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Control user experiences with optional feature settings.
              </li>
              <li className="flex items-center">
                <svg
                  className="min-w-5 h-5 mr-2 text-[#409F9C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Access promotional materials and marketing support to help grow
                your prayer community (coming soon).
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="testimonial-section">
        <h1 className="title">TESTIMONIALS</h1>
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          navigation={{
            prevEl: ".prev",
            nextEl: ".next",
          }}
          pagination={{ clickable: true }}
        >
          {testimonials.map((testimonial, index) => (
            <>
              <SwiperSlide key={index}>
                <div className="card-test">
                  <div className="test-detail">
                    <img src={testimonial.image} alt={testimonial.name} />
                    <div className="test-name">
                      <h3>{testimonial.name}</h3>
                      <img src={star} alt="rating" />
                    </div>
                  </div>
                  <p>"{testimonial.text}"</p>
                </div>
              </SwiperSlide>
            </>
          ))}

          <div className="prev">
            <FontAwesomeIcon icon={faAngleLeft} />
          </div>
          <div className="next">
            <FontAwesomeIcon icon={faAngleRight} style={{ color: "#fffff" }} />
          </div>
        </Swiper>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
