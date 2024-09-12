import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./App.css";
import List from "./Components/List/List";
import Navbar from "./Components/Navbar/Navbar";

function App() {
  const statusList = ["In progress", "Backlog", "Todo", "Done", "Cancelled"];
  const priorityList = [
    { name: "No priority", priority: 0 },
    { name: "Low", priority: 1 },
    { name: "Medium", priority: 2 },
    { name: "High", priority: 3 },
    { name: "Urgent", priority: 4 },
  ];

  const [groupValue, setgroupValue] = useState(
    getStateFromLocalStorage() || "status"
  );
  const [orderValue, setorderValue] = useState("title");
  const [ticketDetails, setticketDetails] = useState([]);
  const [userList, setUserList] = useState([]); // Dynamically loaded user list from API

  const orderDataByValue = useCallback(
    async (cardsArray) => {
      if (orderValue === "priority") {
        cardsArray.sort((a, b) => b.priority - a.priority);
      } else if (orderValue === "title") {
        cardsArray.sort((a, b) => {
          const titleA = a.title.toLowerCase();
          const titleB = b.title.toLowerCase();
          return titleA.localeCompare(titleB);
        });
      }
      setticketDetails(cardsArray);
    },
    [orderValue]
  );

  // Save group value to localStorage
  function saveStateToLocalStorage(state) {
    localStorage.setItem("groupValue", JSON.stringify(state));
  }

  // Retrieve group value from localStorage
  function getStateFromLocalStorage() {
    const storedState = localStorage.getItem("groupValue");
    return storedState ? JSON.parse(storedState) : null;
  }

  useEffect(() => {
    saveStateToLocalStorage(groupValue);
    async function fetchData() {
      const response = await axios.get(
        "https://api.quicksell.co/v1/internal/frontend-assignment"
      );
      await refactorData(response);
    }
    fetchData();

    async function refactorData(response) {
      let ticketArray = [];
      let users = [];
      if (response.status === 200) {
        const { tickets, users: apiUsers } = response.data;

        // Map user names dynamically from API
        users = apiUsers.map((user) => user.name);
        setUserList(users);

        // Attach user data to tickets
        for (let i = 0; i < tickets.length; i++) {
          const user = apiUsers.find((user) => user.id === tickets[i].userId);
          let ticketJson = {
            ...tickets[i],
            userObj: user,
          };
          ticketArray.push(ticketJson);
        }
      }
      setticketDetails(ticketArray);
      orderDataByValue(ticketArray);
    }
  }, [orderDataByValue, groupValue]);

  // Handlers for grouping and ordering
  function handleGroupValue(value) {
    setgroupValue(value);
  }

  function handleOrderValue(value) {
    setorderValue(value);
  }

  return (
    <>
      <Navbar
        groupValue={groupValue}
        orderValue={orderValue}
        handleGroupValue={handleGroupValue}
        handleOrderValue={handleOrderValue}
      />
      <section className="board-details">
        <div className="board-details-list">
          {groupValue === "status" &&
            statusList.map((listItem) => (
              <List
                key={listItem}
                groupValue="status"
                orderValue={orderValue}
                listTitle={listItem}
                ticketDetails={ticketDetails}
                statusList={statusList}
              />
            ))}

          {groupValue === "user" &&
            userList.map((listItem) => (
              <List
                key={listItem}
                groupValue="user"
                orderValue={orderValue}
                listTitle={listItem}
                ticketDetails={ticketDetails}
                userList={userList}
              />
            ))}

          {groupValue === "priority" &&
            priorityList.map((listItem) => (
              <List
                key={listItem.priority}
                groupValue="priority"
                orderValue={orderValue}
                listTitle={listItem.name}
                ticketDetails={ticketDetails}
                priorityList={priorityList}
              />
            ))}
        </div>
        <div></div>
      </section>
    </>
  );
}

export default App;
