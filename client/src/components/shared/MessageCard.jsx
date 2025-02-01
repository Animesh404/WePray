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
  MessageCircle,
} from "lucide-react";

const MessageCard = ({
  userName,
  content,
  createdAt,
  prayerID,
}) => {

  const [expanded, setExpanded] = useState(false);
  const [ShouldShowMore, setShouldShowMore] = useState(false);
  const contentRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();

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
      <div className="flex items-center justify-between px-4 py-2 border-gray-200">
      <PrayerCardHeader
          userName={userName}
        />
        <span className="text-sm text-gray-500">
          {/* {new Date(createdAt).toLocaleTimeString()} ago */}
          {timeAgo(createdAt)}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        

        <p
          className={`text-md px-2 text-gray-700 ${
            !expanded && "line-clamp-2"
          }`}
        >
          {content}
        </p>

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
          
        </div>
      )}

// PrayerCard.propTypes = {
//   userName: PropTypes.string,
//   country: PropTypes.string,
//   category: PropTypes.string,
//   content: PropTypes.string.isRequired,
//   createdAt: PropTypes.string.isRequired,
//   prayerCount: PropTypes.number.isRequired,
//   prayerID: PropTypes.number.isRequired,
//   type: PropTypes.string,
//   logoUrl: PropTypes.string,
// };

// PrayerCard.defaultProps = {
//   userName: "Anonymous",
//   logoUrl: "/api/placeholder/40/40",
// };

export default MessageCard;
