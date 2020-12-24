import React, { Component } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  TouchableHighlight,
  FlatList,
  Alert,
} from "react-native";
import db from "../config";
import firebase from "firebase";
import MyHeader from "../components/MyHeader";
import { BookSearch } from "react-native-google-books";

export default class BookRequestScreen extends Component {
  constructor() {
    super();
    this.state = {
      userId: firebase.auth().currentUser.email,
      bookName: "",
      reasonToRequest: "",
      requestId: "",
      requestedBookName: "",
      bookStatus: "",
      docId: "",
      isBookRequestActive: "",
      userDocId: "",
      dataSource: "",
      showFlatList: "",
    };
  }

  createUniqueId() {
    var rand = Math.random().toString(36);
    console.log(rand);
    return rand.substring(7);
  }

  getIsBookRequestActive = () => {
    db.collection("users")
      .where("email_id", "==", this.state.userId)
      .onSnapshot((snapshot) => {
        snapshot.forEach((doc) => {
          this.setState({
            isBookRequestActive: doc.data().IsBookRequestActive,
            userDocId: doc.id,
          });
        });
      });
  };

  getBookRequest = () => {
    var bookRequest = db
      .collection("requested_books")
      .where("user_id", "==", this.state.userId)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          if (doc.data().book_status !== "received") {
            this.setState({
              requestId: doc.data().request_id,
              requestedBookName: doc.data().book_name,
              bookStatus: doc.data().book_status,
              docId: doc.id,
            });
          }
        });
      });
  };

  addRequest = async (bookName, reasonToRequest) => {
    var userId = this.state.userId;
    var randomRequestId = this.createUniqueId();

    var books = await BookSearch.searchbook(
      bookName,
      "AIzaSyAXkH3EF5d41de2ILcPhhP3zovwsy7vkY0"
    );

    db.collection("requested_books").add({
      user_id: userId,
      book_name: bookName,
      reason_to_request: reasonToRequest,
      request_id: randomRequestId,
      book_status: "requested",
      date: firebase.firestore.FieldValue.serverTimestamp(),
      image_link: books.data[0].volumeInfo.imageLinks.smallThumbnail,
    });
    this.getBookRequest();
    db.collection("users")
      .where("email_id", "==", this.state.userId)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          db.collection("users").doc(doc.id).update({
            IsBookRequestActive: true,
          });
        });
      });

    this.setState({
      bookName: "",
      reasonToRequest: "",
    });

    return Alert.alert("Book Requested Successfully");
  };

  sendNotification = () => {
    db.collection("users")
      .where("email_id", "==", this.state.userId)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          var name = doc.data().first_name;
          var lastName = doc.data().last_name;
          db.collection("all_notifications")
            .where("request_id", "==", this.state.requestId)
            .get()
            .then((snapshot) => {
              snapshot.forEach((doc) => {
                var donorId = doc.data().donor_id;
                var bookName = doc.data().book_name;
                db.collection("all_notifications").add({
                  targeted_user_id: donorId,
                  message:
                    name + " " + lastName + " received the book " + bookName,
                  notification_status: "unread",
                  book_name: bookName,
                });
              });
            });
        });
      });
  };

  updateBookRequestStatus = () => {
    db.collection("requested_books").doc(this.state.docId).update({
      book_status: "received",
    });
    db.collection("users")
      .where("email_id", "==", this.state.userId)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          db.collection("users").doc(doc.id).update({
            IsBookRequestActive: false,
          });
        });
      });
  };

  receivedBooks = (bookName) => {
    var userId = this.state.userId;
    var requestId = this.state.requestId;
    db.collection("received_books").add({
      user_id: userId,
      book_name: bookName,
      request_id: requestId,
      bookStatus: "received",
    });
  };

  getBooksFromAPI = async (bookName) => {
    this.setState({
      bookName: bookName,
    });
    if (bookName.length > 2) {
      var books = await BookSearch.searchbook(
        bookName,
        "AIzaSyAXkH3EF5d41de2ILcPhhP3zovwsy7vkY0"
      );
      this.setState({
        dataSource: books.data,
        showFlatList: true,
      });
      console.log("Book Data" + books.data[0]);
    }
  };

  componentDidMount() {
    this.getIsBookRequestActive();
    this.getBookRequest();
    // var book = BookSearch.searchBook('The Alchemist', 'AIzaSyAXkH3EF5d41de2ILcPhhP3zovwsy7vkY0');
    //console.log(book);
  }

  renderItem = ({ item, i }) => {
    let obj = {
      title: item.volumeInfo.title,
      selfLink: item.selfLink,
      buyLink: item.saleInfo.buyLink,
      imageLink: item.volumeInfo.imageLinks,
    };
    return (
      <TouchableHighlight
        style={{
          alignItems: "center",
          backgroundColor: "#DDDDDD",
          padding: 10,
          width: "90%",
        }}
        activeOpacity={0.6}
        underlayColor="#DDDDDD"
        onPress={() => {
          this.setState({
            showFlatList: false,
            bookName: item.volumeInfo.title,
          });
        }}
        bottomDivider
      >
        <Text>{item.volumeInfo.title}</Text>
      </TouchableHighlight>
    );
  };

  render() {
    if (this.state.isBookRequestActive === true) {
      return (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <View
            style={{
              borderColor: "orange",
              justifyContent: "center",
              borderWidth: 3,
              alignItems: "center",
              padding: 10,
              margin: 10,
            }}
          >
            <Text>Book Name</Text>
            <Text>{this.state.requestedBookName}</Text>
          </View>
          <View
            style={{
              borderColor: "orange",
              justifyContent: "center",
              borderWidth: 3,
              alignItems: "center",
              padding: 10,
              margin: 10,
            }}
          >
            <Text>Book Status</Text>
            <Text>{this.state.bookStatus}</Text>
          </View>
          <TouchableOpacity
            style={{
              alignSelf: "center",
              alignItems: "center",
              width: 300,
              height: 30,
              marginTop: 30,
            }}
            onPress={() => {
              this.sendNotification();
              this.updateBookRequestStatus();
              this.receivedBooks(this.state.requestedBookName);
            }}
          >
            <Text>Received Book</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <MyHeader title="Request Book" navigation={this.props.navigation} />
        <KeyboardAvoidingView style={styles.keyBoardStyle} enabled>
          <TextInput
            style={styles.formTextInput}
            placeholder={"enter book name"}
            onChangeText={(text) => {
              this.getBooksFromAPI(text);
            }}
            onClear={(text) => {
              this.getBooksFromAPI("");
            }}
            value={this.state.bookName}
          />
          {this.state.showFlatList ? (
            <FlatList
              data={this.state.dataSource}
              renderItem={this.renderItem}
              enableEmptySections={true}
              style={{ marginTop: 10 }}
              keyExtractor={(item, index) => {
                index.toString();
              }}
            />
          ) : (
            <View style={{ alignItems: "center" }}>
              <TextInput
                style={[styles.formTextInput, { height: 300 }]}
                multiline
                numberOfLines={8}
                placeholder={"Why do you need the book"}
                onChangeText={(text) => {
                  this.setState({
                    reasonToRequest: text,
                  });
                }}
                value={this.state.reasonToRequest}
              />

              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  this.addRequest(
                    this.state.bookName,
                    this.state.reasonToRequest
                  );
                }}
              >
                <Text>Request</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  keyBoardStyle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  formTextInput: {
    width: "75%",
    height: 35,
    alignSelf: "center",
    borderColor: "#ffab91",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 20,
    padding: 10,
  },
  button: {
    width: "75%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#ff5722",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    marginTop: 20,
  },
});
