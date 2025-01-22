// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUsers,
  faCog,
  faPrayingHands,
  faComments,
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const ITEMS_PER_PAGE = 50;

// Components

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [prayerMessage, setPrayerMessage] = useState("");
  const [prayerID, setPrayerID] = useState(null);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // States
  const [prayers, setPrayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalPrayers: 0,
    pendingPrayers: 0,
    totalEvents: 0,
    prayedForYou: 0,
  });

  // Modal states and forms
  const [showPrayerForm, setShowPrayerForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [prayerForm, setPrayerForm] = useState({
    subject: "",
    message: "",
  });
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_type: "live_prayer",
    start_time: "",
    end_time: "",
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchDashboardData = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const [prayersRes, eventsRes, usersRes, coordinatorsRes] =
        await Promise.all([
          user.role == "admin" || user.role == "coordinator"
            ? api.get(
                `/prayers?page=${page}&limit=${ITEMS_PER_PAGE}&sort=created_at:desc`
              )
            : api.get(
                `/prayers?page=${page}&limit=${ITEMS_PER_PAGE}`
              ),
          api.get("/events"),
          user.role == "admin" || user.role == "coordinator"
            ? api.get("/users/members")
            : null,
          user.role === "admin" ? api.get("/users/coordinators") : null,
        ]);

      setPrayers(
        Array.isArray(prayersRes.data.data.prayers)
          ? prayersRes.data.data.prayers
          : []
      );
      setTotalPages(Math.ceil(prayersRes.data.data.total / ITEMS_PER_PAGE));
      console.log("Received prayers data:", prayersRes.data.data.prayers);

      setEvents(
        Array.isArray(eventsRes.data.data.events)
          ? eventsRes.data.data.events
          : []
      );

      if (user.role === "admin" || user.role === "coordinator") {
        const allUsers = [...(usersRes?.data?.data?.users || [])];
        if (user.role === "admin" && coordinatorsRes) {
          allUsers.push(...coordinatorsRes.data.data.users);
        }
        setUsers(allUsers);
      }

      setStats({
        totalPrayers: prayersRes.data.data.total,
        pendingPrayers:
          prayersRes.data.data.prayers.filter((p) => p.status === "pending")
            ?.length || 0,
        totalEvents: eventsRes.data.data.events.length,
        prayedForYou: prayersRes.data.data.prayers.reduce((acc, prayer) => acc + (prayer.pray_count || 0), 0),
      });
    } catch (error) {
      console.error("Dashboard data error:", error);
      setError("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(currentPage);
  }, [currentPage, user.role]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleMakeCoordinator = async (userId) => {
    try {
      const newRole =
        users.find((u) => u.id === userId)?.role === "coordinator"
          ? "member"
          : "coordinator";
      await api.put(`/users/role/${userId}`, { role: newRole });
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to update user role:", error);
      if (error.response?.status === 403) {
        setError("Unauthorized: Only admins can modify user roles");
      } else {
        setError("Failed to update user role");
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/delete/${userId}`);
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to update user status:", error);
      if (error.response?.status === 403) {
        setError("Unauthorized: Insufficient permissions");
      } else {
        setError("Failed to update user status");
      }
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await api.delete(`/events/${eventId}`);
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to delete event:", error);
      if (error.response?.status === 403) {
        setError("Unauthorized: Insufficient permissions");
      } else {
        setError("Failed to delete");
      }
    }
  };

  const handlePrayerSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/prayers", prayerForm);
      setShowPrayerForm(false);
      setPrayerForm({ subject: "", message: "" });
      fetchDashboardData();
    } catch (error) {
      console.error("Prayer submission error:", error.response?.data || error);
      setError(
        error.response?.data?.message || "Failed to submit prayer request"
      );
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/events", eventForm);
      setShowEventForm(false);
      setEventForm({
        title: "",
        description: "",
        event_type: "live_prayer",
        start_time: "",
        end_time: "",
      });
      fetchDashboardData();
    } catch (error) {
      setError("Failed to create event");
    }
  };

  const handlePrayerStatusUpdate = async (prayerId, status) => {
    try {
      await api.put(`/prayers/${prayerId}/status`, { status });
      fetchDashboardData();
    } catch (error) {
      console.log(error);
      setError("Failed to update prayer status");
    }
  };

  const handlePrayerMessageUpdate = async (prayerId, message) => {
    try {
      await api.put(`/prayers/${prayerId}/message`, { message });
      setShowEditForm(false);
      fetchDashboardData();
    } catch (error) {
      console.log(error);
      setError("Failed to update prayer status");
    }
  };

  const handlePrayerEdit = async (prayerId) => {
    try {
      setPrayerID(prayerId);
      const prayerData = await api.get(`/prayers/${prayerId}`);
      console.log(prayerData.data.data.message);
      setPrayerMessage(prayerData.data.data.message);
      setShowEditForm(true);
    } catch (error) {
      console.log(error);
      setError("Failed to update prayer status");
    }
  };

  const handleMessageChange = (e) => {
    setPrayerMessage(e.target.value);
  };

  const handlePrayerDelete = async (prayerId) => {
    try {
      await api.delete(`/prayers/${prayerId}`);
      fetchDashboardData();
    } catch (error) {
      console.log(error);
      setError("Failed to update prayer status");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/role/${userId}`, { role: newRole });
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to update user role:", error);
      setError("Failed to update user role");
    }
  };

  const PaginationControls = () => (
    <div className="flex justify-center mt-4 space-x-2">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-200 rounded disabled:bg-gray-300 disabled:text-gray-500"
      >
        Previous
      </button>

      {[...Array(Math.min(5, totalPages))].map((_, idx) => {
        let pageNum;
        if (totalPages <= 5) {
          pageNum = idx + 1;
        } else if (currentPage <= 3) {
          pageNum = idx + 1;
        } else if (currentPage >= totalPages - 2) {
          pageNum = totalPages - 4 + idx;
        } else {
          pageNum = currentPage - 2 + idx;
        }

        return (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            className={`px-4 py-2 rounded ${
              currentPage === pageNum
                ? "bg-[#409F9C] text-white"
                : "bg-gray-200"
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-gray-200  rounded disabled:bg-gray-300 disabled:text-gray-500"
      >
        Next
      </button>
    </div>
  );
  const renderUserManagementSection = () => {
    if (user.role !== "admin" && user.role !== "coordinator") return null;

    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-8">
        <h2 className="text-xl font-semibold mb-4 p-4">Manage Users</h2>
        <table className="min-w-full divide-y divide-gray-200 responsive-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td data-label="Name" className="px-6 py-4 whitespace-nowrap">
                  {u.name}
                </td>
                <td data-label="Email" className="px-6 py-4 whitespace-nowrap">
                  {u.email}
                </td>
                <td data-label="Role" className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={u.role}
                    onChange={(e) =>
                      user.role === "admin" &&
                      handleRoleChange(u.id, e.target.value)
                    }
                    className="border bg-white border-gray-300 rounded-md"
                    disabled={user.role !== "admin"}
                  >
                    <option value="member">Member</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td
                  data-label="Actions"
                  className="px-6 py-4 whitespace-nowrap action-buttons"
                >
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-6 mb-8 stats-grid">
              <div className="bg-[#409F9C] text-white p-5 rounded-lg">
                <div className="text-white">Total Prayers</div>
                <div className="text-3xl text-white">{stats.totalPrayers}</div>
              </div>
              {(user.role === "member") && (
              <div className="bg-[#409F9C] text-white p-5 rounded-lg">
                <div className="text-white">People Prayed for You</div>
                <div className="text-3xl text-white">{stats.prayedForYou}</div>
              </div>
              )}
              {(user.role === "admin" || user.role === "coordinator") && (
                <div className="bg-[#409F9C] text-white p-5 rounded-lg">
                  <div className="text-white">New Prayer Requests</div>
                  <div className="text-3xl text-white">
                    {stats.pendingPrayers}
                  </div>
                </div>
              )}
              {(user.role === "admin" || user.role === "coordinator") && (
                <div className="bg-[#409F9C] text-white p-5 rounded-lg">
                  <div className="text-white">Active Members</div>
                  <div className="text-3xl text-white">{users.length}</div>
                </div>
              )}
            </div>

            {/* Prayer Requests Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-8">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Recent Prayer Requests
                </h2>
                <div className="text-sm text-gray-500">
                  Total: {prayers.length} | Pending: {stats.pendingPrayers}
                </div>
              </div>
              <table className="min-w-full divide-y divide-gray-200 responsive-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pray Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    {(user.role === "admin" || user.role === "coordinator") && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prayers.map((prayer) => (
                    <tr key={prayer.id}>
                      <td data-label="Name" className="px-6 py-4">
                        {prayer.name}
                      </td>
                      <td data-label="Date" className="px-6 py-4">
                        {prayer.created_at
                          ? new Date(prayer.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "N/A"}
                      </td>
                      <td data-label="Report Count" className="px-6 py-4">
                        {prayer.pray_count}
                      </td>
                      <td data-label="Type" className="px-6 py-4">
                        {prayer.type}
                      </td>
                      <td data-label="Message" className="px-6 py-4">
                        {prayer.message}
                      </td>
                      <td data-label="Status" className="px-6 py-4">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full status-badge
                                                    ${
                                                      prayer.status ===
                                                      "approved"
                                                        ? "bg-green-100 text-green-800"
                                                        : prayer.status ===
                                                          "rejected"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                    }`}
                        >
                          {prayer.status}
                        </span>
                      </td>
                      {(user.role === "admin" ||
                        user.role === "coordinator") && (
                        <td
                          data-label="Actions"
                          className="px-6 py-4 whitespace-nowrap flex flex-col text-sm"
                        >
                          {prayer.status !== "approved" && (
                            <button
                              onClick={() =>
                                handlePrayerStatusUpdate(prayer.id, "approved")
                              }
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded-md"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handlePrayerDelete(prayer.id)}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded-md"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handlePrayerEdit(prayer.id)}
                            className="px-4 py-1 bg-yellow-500 text-xs text-white rounded-md"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      case "manage_users":
        return renderUserManagementSection();
      case "prayer_requests":
        return (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Prayer Requests</h2>
              <div className="text-sm text-gray-500">
                Total: {prayers.length} | Pending: {stats.pendingPrayers}
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-200 responsive-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Report Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  {(user.role === "admin" || user.role === "coordinator") && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prayers.map((prayer) => (
                  <tr key={prayer.id}>
                    <td
                      data-label="Name"
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {prayer.name}
                    </td>
                    <td
                      data-label="Date"
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {prayer.created_at
                        ? new Date(prayer.created_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "N/A"}
                    </td>
                    <td
                      data-label="Report Count"
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {prayer.report_count}
                    </td>
                    <td
                      data-label="Type"
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {prayer.type}
                    </td>
                    <td
                      data-label="Message"
                      className="px-6 py-4 whitespace-normal max-w-xs truncate"
                    >
                      {prayer.message}
                    </td>
                    <td
                      data-label="Status"
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${
                                                  prayer.status === "approved"
                                                    ? "bg-green-100 text-green-800"
                                                    : prayer.status ===
                                                      "rejected"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                                }`}
                      >
                        {prayer.status}
                      </span>
                    </td>
                    {(user.role === "admin" || user.role === "coordinator") && (
                      <td
                        data-label="Action"
                        className=" px-6 py-4 whitespace-nowrap text-xs flex flex-col action-buttons"
                      >
                        {prayer.status !== "approved" && (
                          <button
                            onClick={() =>
                              handlePrayerStatusUpdate(prayer.id, "approved")
                            }
                            className="px-3 py-1 bg-green-500 text-white rounded-md"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handlePrayerDelete(prayer.id)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded-md"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handlePrayerEdit(prayer.id)}
                          className="px-4 py-1 bg-yellow-500 text-xs text-white rounded-md"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "events":
        return (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Events</h2>
              {(user.role === "admin" || user.role === "coordinator") && (
                <button
                  onClick={() => setShowEventForm(true)}
                  className="bg-[#409F9C] text-white px-4 py-2 rounded-md"
                >
                  Create Event
                </button>
              )}
            </div>

            {/* Event listing table */}
            <table className="min-w-full divide-y divide-gray-200 responsive-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    End Time
                  </th>
                  {(user.role === "admin" || user.role === "coordinator") && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td
                      data-label="Title"
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {event.title}
                    </td>
                    <td
                      data-label="Event Type"
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {event.event_type}
                    </td>
                    <td
                      data-label="Starts at"
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {new Date(event.start_time).toLocaleString()}
                    </td>
                    <td
                      data-label="Ends at"
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {new Date(event.end_time).toLocaleString()}
                    </td>
                    {(user.role === "admin" || user.role === "coordinator") && (
                      <td
                        data-label="Actions"
                        className="px-6 py-4 whitespace-nowrap action-buttons"
                      >
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Event creation modal */}
            {showEventForm && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg w-11/12 sm:w-1/2">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">
                    Create New Event
                  </h3>
                  <form onSubmit={handleEventSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, title: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md bg-white text-gray-900 placeholder-gray-500 border border-gray-300 p-2 shadow-sm focus:ring-2 focus:ring-[#409F9C] focus:border-[#409F9C]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        value={eventForm.description}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            description: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md bg-white text-gray-900 placeholder-gray-500 border border-gray-300 p-2 shadow-sm focus:ring-2 focus:ring-[#409F9C] focus:border-[#409F9C]"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Event Type
                      </label>
                      <select
                        value={eventForm.event_type}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            event_type: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border bg-white text-gray-900 placeholder-gray-500 border-gray-300 p-2 shadow-sm focus:ring-2 focus:ring-[#409F9C] focus:border-[#409F9C]"
                      >
                        <option value="live_prayer">Live Prayer</option>
                        <option value="workshop">Workshop</option>
                        <option value="meeting">Meeting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={eventForm.start_time}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            start_time: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border bg-gray-300 text-gray-900 placeholder-gray-500 border-gray-300 p-2 shadow-sm focus:ring-2 focus:ring-[#409F9C] focus:border-[#409F9C]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={eventForm.end_time}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            end_time: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border bg-gray-300 text-gray-900 placeholder-gray-500 border-gray-300 p-2 shadow-sm focus:ring-2 focus:ring-[#409F9C] focus:border-[#409F9C]"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowEventForm(false)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md focus:ring-2 focus:ring-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-[#409F9C] hover:bg-[#367f7d] text-white px-4 py-2 rounded-md focus:ring-2 focus:ring-[#409F9C]"
                      >
                        Create Event
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return <div>Coming Soon</div>;
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden dashboard-container">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-200 p-4 dashboard-sidebar">
        <a href="/">
          <div className="text-lg font-bold mb-0">WiPray</div>
        </a>
        {user.role === "admin" && (
          <div className="text-sm font-medium mb-8 ">Admin Panel</div>
        )}
        {user.role === "coordinator" && (
          <div className="text-sm font-medium mb-4">Coordinator</div>
        )}
        <ul>
          <li
            className={`mb-2 p-2 rounded cursor-pointer `}
            onClick={() => navigate("/")}
          >
            Home
          </li>
          <li
            className={`mb-2 p-2 rounded cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-[#409F9C] text-white"
                : "hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </li>

          {(user.role === "admin" || user.role === "coordinator") && (
            <li
              className={`mb-2 p-2 rounded cursor-pointer ${
                activeTab === "manage_users"
                  ? "bg-[#409F9C] text-white"
                  : "hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("manage_users")}
            >
              Manage User Access
            </li>
          )}
          {(user.role === "admin" || user.role === "coordinator") && (
            <li
              className={`mb-2 p-2 rounded cursor-pointer ${
                activeTab === "community"
                  ? "bg-[#409F9C] text-white"
                  : "hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("community")}
            >
              Community Settings
            </li>
          )}
          {(user.role === "admin" || user.role === "coordinator") && (
            <li
              className={`mb-2 p-2 rounded cursor-pointer ${
                activeTab === "prayer_requests"
                  ? "bg-[#409F9C] text-white"
                  : "hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("prayer_requests")}
            >
              Prayer Requests
            </li>
          )}
          <li
            className={`mb-2 p-2 rounded cursor-pointer ${
              activeTab === "comments"
                ? "bg-[#409F9C] text-white"
                : "hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab("comments")}
          >
            Comments and Reactions
          </li>
          <li
            className={`mb-2 p-2 rounded cursor-pointer ${
              activeTab === "events"
                ? "bg-[#409F9C] text-white"
                : "hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab("events")}
          >
            Events
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="w-3/4 p-6 overflow-y-auto dashboard-content">
        <div className="mobile-dashboard-menu">
          <div className="flex items-center gap-2">
            {/* <img src="../assets/logo.png" alt="" className="h-8 w-10 flex" /> */}
            <h1 className="font-semibold text-lg">Dashboard</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-2xl p-2"
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
          </button>
        </div>

        <div className={`mobile-menu-drawer ${isMobileMenuOpen ? "open" : ""}`}>
          <div className="p-4 pt-16">
            <h2 className="text-lg font-bold mb-6">Menu</h2>
            <ul className="space-y-3">
              <li
                onClick={() => navigate("/")}
                className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100`}
              >
                Home
              </li>
              <li
                onClick={() => {
                  setActiveTab("dashboard");
                  setIsMobileMenuOpen(false);
                }}
                className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors
                                    ${
                                      activeTab === "dashboard"
                                        ? "bg-[#409F9C] text-white hover:bg-[#409F9C]"
                                        : ""
                                    }`}
              >
                Dashboard
              </li>

              {(user.role === "admin" || user.role === "coordinator") && (
                <li
                  onClick={() => {
                    setActiveTab("manage_users");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors
                                        ${
                                          activeTab === "manage_users"
                                            ? "bg-[#409F9C] text-white hover:bg-[#409F9C]"
                                            : ""
                                        }`}
                >
                  Manage Users
                </li>
              )}
              <li
                onClick={() => {
                  setActiveTab("prayer_requests");
                  setIsMobileMenuOpen(false);
                }}
                className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors
                                    ${
                                      activeTab === "prayer_requests"
                                        ? "bg-[#409F9C] text-white hover:bg-[#409F9C]"
                                        : ""
                                    }`}
              >
                Prayer Requests
              </li>
              <li
                onClick={() => {
                  setActiveTab("events");
                  setIsMobileMenuOpen(false);
                }}
                className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors
                                    ${
                                      activeTab === "events"
                                        ? "bg-[#409F9C] text-white hover:bg-[#409F9C]"
                                        : ""
                                    }`}
              >
                Events
              </li>
            </ul>
          </div>
        </div>

        {/* Overlay - Moved outside of switch statement */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <span>
          <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
          <h2 className=" p-1 text-xl font-bold">
  Note: Site is under maintenance, some features may not work as intended.
</h2>
          </span>
          
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-md"
          >
            Logout
          </button>
        </div>

        {/* Dynamic Content based on active tab */}
        {renderContent()}
        <PaginationControls />

        {/* Modals */}
        {showEditForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg modal-content">
              <h3 className="text-lg font-medium mb-4">Edit Prayer Message</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePrayerMessageUpdate(prayerID, prayerMessage);
                  setShowEditForm(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    value={prayerMessage}
                    onChange={handleMessageChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                    rows={4}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#409F9C] text-white px-4 py-2 rounded-md"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
