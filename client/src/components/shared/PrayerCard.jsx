import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import PrayerCardHeader from "./PrayerCardHeader";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/axios";
import logo from "../../assets/logo.png";
import {
  ChevronDown,
  ChevronUp,
  Bookmark,
  Flag,
  Share2,
  Info,
  Mail,
  Facebook,
  Twitter,
  Link,
  MessageSquareMore,
} from "lucide-react";

const PrayerCard = ({
  userName,
  country,
  categories,
  content,
  createdAt,
  prayerCount: initialPrayerCount,
  prayerID,
  userId,
  type,
  logoUrl,
}) => {
  // Input validation
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error(
      "PrayerCard: content is required and must be a non-empty string"
    );
  }

  if (!createdAt || isNaN(Date.parse(createdAt))) {
    throw new Error("PrayerCard: createdAt must be a valid date string");
  }

  if (
    type === "prayer" &&
    (typeof initialPrayerCount !== "number" || initialPrayerCount < 0)
  ) {
    throw new Error("PrayerCard: prayerCount must be a non-negative number");
  }

  const [prayedText, setPrayText] = useState("I prayed for this");
  const [expanded, setExpanded] = useState(false);
  const [prayerCount, setPrayerCount] = useState(initialPrayerCount);
  const [isPrayed, setIsPrayed] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [shouldShowMore, setShouldShowMore] = useState(false);
  const contentRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();
  // const [reported, setReported] = useState(false);
  // console.log(categories);
  // console.log(userId);
  const prayerDetails = {
    message: content,
    link: `https://wipray.com/prayers/${prayerID}`,
  };

  const handleShare = () => {
    // Replace this URL with your actual prayer URL/link
    const linkToCopy = `https://wipray.com/prayers/${prayerID}`;
    
    navigator.clipboard.writeText(linkToCopy)
      .then(() => {
        // Optional: Add some visual feedback that copy succeeded
        alert("Link copied to clipboard!");
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
      });
  };
  const facebookShare = (prayerDetails) => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      prayerDetails.link
    )}&quote=${encodeURIComponent(prayerDetails.message)}`;
    window.open(url, "_blank", "width=600,height=400");
  };
  const emailShare = (prayerDetails) => {
    const subject = "Prayer Details";
    const body = `Check out this prayer request:\n\nMessage: ${prayerDetails.message}\nLink: ${prayerDetails.link}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };
  const xShare = (prayerDetails) => {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(
      prayerDetails.message
    )}&url=${encodeURIComponent(prayerDetails.link)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const timeAgo = (createdAt) => {
    const now = new Date();
    const createdDate = new Date(createdAt);
    const diffInMs = now - createdDate;
    const diffInMinutes = Math.floor(diffInMs / 1000 / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays >= 1) {
      return createdDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } else if (diffInHours >= 1) {
      return `${diffInHours} hours ago`;
    } else {
      return `${diffInMinutes} minutes ago`;
    }
  };
  const handlePray = async () => {
    if (!isPrayed) {
      try {
        const updatedCount = initialPrayerCount + 1;
        console.log("updated counter", updatedCount);
        await api.put(`/prayers/${prayerID}/prayCount`, {
          data: { updatedCount },
        });
        console.log(prayerID);
        setPrayerCount((prev) => prev + 1);
        setIsPrayed(true);
        setPrayText("Prayed");
      } catch (error) {
        console.error("Error occurred while praying:", error);
      }
    }
  };

  const handleComment = () => {
    navigate(`/prayers/${prayerID}`);
  };

  const handleLogoError = () => {
    setLogoError(true);
    console.warn("Failed to load logo image:", logoUrl);
  };

  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        const isOverflowing =
          contentRef.current.scrollHeight > contentRef.current.clientHeight;
        setShouldShowMore(isOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [content]);
  // console.log(category);
  return (
    <div className="w-full rounded-lg border border-gray-200 gap-2 bg-white shadow-md relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <span className="text-sm text-gray-500">
          {/* {new Date(createdAt).toLocaleTimeString()} ago */}
          {timeAgo(createdAt)}
        </span>
        {type === "prayer" && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {prayerCount} prayers
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <PrayerCardHeader
          userName={userName}
          country={country}
          categories={categories}
        />

        <p
          className={`text-sm px-2 text-gray-700 ${
            !expanded && "line-clamp-2"
          }`}
        >
          {content}
        </p>

        {type === "prayer" && (
          <div>
            <button
              className={`mt-4 px-2 py-1 md:px-4 md:py:2 text-sm rounded-md ${
                isPrayed
                  ? "border bg-gray-200 border-gray-500 text-gray-700"
                  : "bg-gray-200 border-gray-500 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={handlePray}
              disabled={isPrayed}
            >
              {prayedText}
            </button>
            {!id && userId && (
              <button
                className=" px-3 py-2 m-2 border-gray-300 text-sm text-left bg-gray-100 rounded-md flex items-center"
                onClick={handleComment}
              >
                <MessageSquareMore className="h-4 w-4" />
                Message
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-1">
          <button
            className="p-1 mt-4 bg-gray-100 rounded-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <span className=" p-2 text-xs">{expanded ? "less" : "more"}</span>
        </div>
      </div>

      {/* Expanded Footer */}
      {expanded && (
        <div className="px-4 pb-4">
          <hr className="w-full my-2" />
          {type === "prayer" && (
            <div>
              <button className="w-full px-3 py-2 mb-2 border-gray-300 text-sm text-left bg-gray-100 rounded-md flex items-center">
                <Bookmark className="h-4 w-4 mr-2" />
                Bookmark
              </button>

              <button className="w-full px-3 py-2 mb-2 border-gray-300 text-sm text-left bg-gray-100 rounded-md flex items-center" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share this prayer
              </button>

              <div className="flex gap-2 pl-6 mt-2">
                <button
                  onClick={() => facebookShare(prayerDetails)}
                  className="p-2 bg-gray-100 rounded-full mb-2 border-gray-300"
                >
                  <Facebook className="h-4 w-4" />
                </button>
                <button
                  onClick={() => xShare(prayerDetails)}
                  className="p-2 bg-gray-100 rounded-full mb-2 border-gray-300"
                >
                  <Twitter className="h-4 w-4" />
                </button>
                <button
                  onClick={() => emailShare(prayerDetails)}
                  className="p-2 bg-gray-100 rounded-full mb-2 border-gray-300"
                >
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <a className="text-gray-800" href={`/prayers/${prayerID}/report`}>
            <button className="w-full px-3 py-2 mb-2 border-gray-300 text-sm text-left bg-gray-100 rounded-md flex items-center">
              <Flag className="h-4 w-4 mr-2" />
              Flag as inappropriate
            </button>
          </a>
          {/* {/* {!id && ( */}
          {!id && (
          <a className="text-gray-800" href={`/prayers/${prayerID}`}>
            <button className="w-full px-3 py-2 mb-2 border-gray-300 text-sm text-left bg-gray-100 rounded-md flex items-center">
              <Info className="h-4 w-4 mr-2" />
              {type} details
            </button>
          </a>
          )}
        </div>
      )}

      {/* Logo in bottom right corner with reduced brightness */}
      {!logoError && type === "prayer" && logoUrl && !expanded && (
        <div className="absolute bottom-2 right-2">
          <img
            src={logo}
            alt="Logo"
            className="w-20 h-20 object-contain opacity-50"
            onError={handleLogoError}
          />
        </div>
      )}
    </div>
  );
};

PrayerCard.propTypes = {
  userName: PropTypes.string,
  country: PropTypes.string,
  category: PropTypes.string,
  content: PropTypes.string.isRequired,
  createdAt: PropTypes.string.isRequired,
  prayerCount: PropTypes.number.isRequired,
  prayerID: PropTypes.number.isRequired,
  type: PropTypes.string,
  logoUrl: PropTypes.string,
};

PrayerCard.defaultProps = {
  userName: "Anonymous",
  logoUrl: "/api/placeholder/40/40",
};

export default PrayerCard;
