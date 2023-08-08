import User from "../models/UserSchema.js";
import Message from "../models/MessageSchema.js";
import Post from "../models/PostSchema.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";

export const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        const arrayUser = [user];
        const formattedUser = arrayUser.map(
            ({ _id, firstName, lastName, occupation, location, profilePhoto, email, friends, linkedinUrl, twitterUrl, viewedProfile, impressions, otp }) => {
                return { _id, firstName, lastName, occupation, location, profilePhoto, email, friends, linkedinUrl, twitterUrl, viewedProfile, impressions, otp };
            }
        );
        res.status(StatusCodes.OK).json(formattedUser[0]);
    } catch (error) {
        res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
    }
};

export const getSingleUser = async (req, res) => {
    try {
        const { email } = req.body;
        const allUsers = await User.find({});

        const singleUser = allUsers.filter(user => user.email === email);
        let formattedUser = singleUser;
        if (singleUser) {
            formattedUser = singleUser.map(
                ({ _id, firstName, lastName, occupation, location, profilePhoto }) => {
                    return { _id, firstName, lastName, occupation, location, profilePhoto };
                }
            );
        }
        res.status(StatusCodes.OK).json(formattedUser);
    } catch (error) {
        res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
    }
}

export const getUserFriends = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        const friends = await Promise.all(
            user.friends.map((id) => User.findById(id))
        );

        const formattedFriends = friends.map(
            ({ _id, firstName, lastName, occupation, location, profilePhoto }) => {
                return { _id, firstName, lastName, occupation, location, profilePhoto };
            }
        );
        res.status(StatusCodes.OK).json(formattedFriends);
    } catch (err) {
        res.status(StatusCodes.NOT_FOUND).json({ message: err.message });
    }
};

export const getSuggestedUsers = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        let allUsers = await User.find({});

        const suggestedUsers = allUsers.filter(item => {
            return user.friends.includes(item._id.toString()) === false && item._id != id;
        })
        const formattedSuggested = suggestedUsers.map(
            ({ _id, firstName, lastName, occupation, location, profilePhoto }) => {
                return { _id, firstName, lastName, occupation, location, profilePhoto };
            }
        );

        res.status(StatusCodes.OK).json(formattedSuggested);
    } catch (err) {
        res.status(StatusCodes.NOT_FOUND).json({ message: err.message });
    }
}

export const addRemoveFriend = async (req, res) => {
    try {
        const { id, friendId } = req.params;
        const user = await User.findById(id);
        const friend = await User.findById(friendId);

        if (user.friends.includes(friendId)) {
            user.friends = user.friends.filter((id) => id !== friendId);
            friend.friends = friend.friends.filter((id) => id !== id);
        } else {
            user.friends.push(friendId);
            friend.friends.push(id);
        }

        await user.save();
        await friend.save();

        const friends = await Promise.all(
            user.friends.map((id) => User.findById(id))
        );

        const formattedFriends = friends.map(
            ({ _id, firstName, lastName, occupation, location, profilePhoto }) => {
                return { _id, firstName, lastName, occupation, location, profilePhoto };
            }
        );
        res.status(StatusCodes.OK).json(formattedFriends);
    } catch (err) {
        res.status(StatusCodes.NOT_FOUND).json({ message: err.message });
    }
};

export const updateSocialProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { linkedinURL, twitterURL } = req.body;
        const user = await User.findById(id);
        user.linkedinUrl = linkedinURL;
        user.twitterUrl = twitterURL;
        const updatedUser = await User.findOneAndUpdate({ _id: id }, {
            ...user,
        }, { new: true, runValidators: true });

        res.status(StatusCodes.OK).json(updatedUser);
    } catch (error) {
        res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
    }
}

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        const user = await User.findById(id);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(StatusCodes.OK).json("Incorrect Password!");

        await Message.deleteMany({ sender: id });
        await Message.deleteMany({ reciever: id });

        await Post.deleteMany({ userId: id });
        const allPosts = await Post.find({});
        for (let post of allPosts) {
            if (post.comments) post.comments = post.comments.filter(obj => obj['userId'] !== id); // comment delete
            post.likes.delete(id);
            await post.save();
        }

        await User.findByIdAndDelete(id);
        const allUsers = await User.find({});
        for (let user of allUsers) {
            const index = user.friends.indexOf(id);
            if (index != -1) user.friends.splice(index, 1);
            await user.save();
        }

        res.status(StatusCodes.OK).json("done");
    } catch (error) {
        res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
    }
}