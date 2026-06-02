import { DRILL_TYPE_GRAPH, EXERTION_GRAPH, NUM_DRILLS_GRAPH } from "../Components/LoadTrackingComponents";
import { supabase } from '../supabaseClient';
import { LOADING_OVERLAY, TYPING_INPUT } from '../Components/SharedComponents';
import { useEffect, useRef, useState } from "react";
import '../App.css';
import './PlayerProfile.css';

export function DELETE_CONFIRM({
    deleteRef,
    setShowDelete,
    selectedPlayer,
    deletePlayer,
    isDeleting
}) {
    const playerName = selectedPlayer
        ? `${selectedPlayer.first_name} ${selectedPlayer.last_name}`
        : 'this player';

    return (
        <div 
            id="drill-modal-overlay"
            onClick={(e) => {
                if (deleteRef.current && !deleteRef.current.contains(e.target)) {
                    setShowDelete(false);
                }
            }}
        >
            <div className="drill-modal" ref={deleteRef}>
                <div className="drill-modal-header">
                    <span className="drill-modal-title">Delete Player</span>
                    <button 
                        className="drill-icon-btn" 
                        onClick={() => setShowDelete(false)} 
                        style={{ border: 'none', background: 'transparent' }}
                    >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="drill-modal-body">
                    <div className="drill-delete-title">
                        Delete "{playerName}"?
                    </div>
                    <div className="drill-delete-body">
                        This player and all their associated data will be permanently removed.
                    </div>
                </div>
                <div className="drill-modal-footer">
                    <button 
                        className="drill-btn drill-btn-danger-solid" 
                        onClick={deletePlayer} 
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Player'}
                    </button>
                </div>
            </div>
        </div>
    );
}
export function ADD_STRENGTH_WEAKNESS({
    modalRef,
    setShowModal,
    type, // strength or weakness
    onAdd,
    isSaving
}) {
    const [value, setValue] = useState("");

    function handleAdd() {
        const trimmed = value.trim();

        if (!trimmed) return;

        onAdd(trimmed);
        setValue("");
    }
    
    const typeLabel = (type === 'strength')
        ? 'STRENGTH *'
        : 'WEAKNESS *';

    return (
        <div
            id="drill-modal-overlay"
            onClick={(e) => {
                if (modalRef.current && !modalRef.current.contains(e.target)) {
                    setShowModal(false);
                }
            }}
        >
            <div className="drill-modal" ref={modalRef}>
                <div className="drill-modal-header">
                    <span className="drill-modal-title">
                        Add {type === "strength" ? "Strength" : "Weakness"}
                    </span>

                    <button
                        className="drill-icon-btn"
                        onClick={() => setShowModal(false)}
                        style={{
                            border: "none",
                            background: "transparent"
                        }}
                    >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="drill-modal-body">
                    <TYPING_INPUT
                        label={typeLabel}
                        num_rows="1"
                        input_id="strength-weakness"
                        box_w="100%"
                        box_h="40px"
                        value={value}
                        onChange={setValue}
                        maxLength={25}
                        isNumber={false}
                    />
                </div>

                <div className="drill-modal-footer">
                    <button
                        className="drill-btn drill-btn-primary"
                        onClick={handleAdd}
                        disabled={isSaving || !value.trim()}
                    >
                        {isSaving ? "Saving..." : "Add"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PLAYER_LIST({ players, setSelectedPlayer }) {
    return (
        <div
            className="player-list"
        >
            {players.map((player) => (
                <PLAYER_CARD
                    key={player.id}
                    player={player}
                    setSelectedPlayer={setSelectedPlayer}
                />
            ))}
        </div>
    );
}

function PLAYER_CARD({ player, setSelectedPlayer }) {
    return (
        <div
            className="player-card"
        >
            <div
                className="player-card-name"
            >
                {player.first_name} {player.last_name}
            </div>
            <button
                className="drill-btn drill-btn-ghost"
                onClick={() => setSelectedPlayer(player)}
            >
                Details
            </button>
        </div>
    );
}

function PLAYER_DETAILS({ player, playerDetails, setSelectedPlayer, setShowDeleteConfirm, setPlayerDetails, setShowAddModal, setAddType }) {
    if (!playerDetails) return null;
    console.log("player details: ", playerDetails.strengths);
    const name = `${player.first_name} ${player.last_name}`;
    const strengths = playerDetails.strengths;
    const weaknesses = playerDetails.weaknesses;


    // delete strength[index] from the database
    async function deleteStrength(index) {
        if (!player || !playerDetails) return;

        const newStrengths = playerDetails.strengths.filter(
            (_, i) => i !== index
        );

        const { error } = await supabase
            .from('player_details')
            .update({
                strengths: newStrengths
            })
            .eq('id', player.id);

        if (error) {
            console.log("Error deleting strength:", error.message);
            return;
        }

        setPlayerDetails({
            ...playerDetails,
            strengths: newStrengths
        });
    }

    // delete weakness[index] from the database
    async function deleteWeakness(index) {
        if (!player || !playerDetails) return;

        const newWeaknesses = playerDetails.weaknesses.filter(
            (_, i) => i !== index
        );

        const { error } = await supabase
            .from('player_details')
            .update({
                weaknesses: newWeaknesses
            })
            .eq('id', player.id);

        if (error) {
            console.log("Error deleting weakness:", error.message);
            return;
        }

        setPlayerDetails({
            ...playerDetails,
            weaknesses: newWeaknesses
        });
    }

    return (
        <div id="player-details-page">
            <div id="player-details-back">
                <button
                    className="drill-btn drill-btn-ghost"
                    onClick={() => setSelectedPlayer(null)}
                >
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Back to List
                </button>
            </div>
            <div id="player-details-name-container">
                <div id="player-details-name">{name}</div>
                <button
                    className="drill-btn drill-btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Delete Player
                </button>
            </div>

            <div id="player-strength-weakness">
                <div className="strength-weakness-box">
                    <div className="top-container">
                        <h2 className="content-header">Player Strengths</h2>
                        {strengths.length < 5 && (
                            <button
                                className="drill-btn drill-btn-primary"
                                onClick={() => {
                                    setAddType("strength");
                                    setShowAddModal(true);
                                }}
                            >
                                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="tagList">
                        {strengths.length > 0 ? (
                            strengths.map((item, i) => <span className="positiveTag" key={i}>
                                {item}
                                <button
                                    className="drill-btn drill-btn-ghost"
                                    onClick={() => deleteStrength(i)}
                                >
                                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button> 
                            </span>)
                        ) : (
                            <p>No strengths added.</p>
                        )}
                    </div>
                </div>

                <div className="strength-weakness-box">
                    <div className="top-container">
                        <h2 className="content-header">Player Weaknesses</h2>
                        {weaknesses.length < 5 && (
                            <button
                                className="drill-btn drill-btn-primary"
                                onClick={() => {
                                    setAddType("weakness");
                                    setShowAddModal(true);
                                }}
                            >
                                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="tagList">
                        {weaknesses.length > 0 ? (
                            weaknesses.map((item, i) => <span className="warningTag" key={i}>
                                {item}
                                <button
                                    className="drill-btn drill-btn-ghost"
                                    onClick={() => deleteWeakness(i)}
                                >
                                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>)
                        ) : (
                            <p>No weakness added.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PlayerProfile() {
    const [isDataLoading, setIsDataLoading] = useState(false);

    const [players, setPlayers] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const deleteConfirmRef = useRef(null);

    const [isDeleting, setIsDeleting] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [addType, setAddType] = useState("strength");
    const [isSaving, setIsSaving] = useState(false);

    const addModalRef = useRef(null);

    async function addStrengthWeakness(value) {
        if (!playerDetails) return;

        setIsSaving(true);

        const field =
            addType === "strength"
                ? "strengths"
                : "weaknesses";

        const updatedArray = [
            ...(playerDetails[field] || []),
            value
        ];

        const { error } = await supabase
            .from("player_details")
            .update({
                [field]: updatedArray
            })
            .eq("id", selectedPlayer.id);

        if (error) {
            console.log(error.message);
        } else {
            setPlayerDetails(prev => ({
                ...prev,
                [field]: updatedArray
            }));

            setShowAddModal(false);
        }

        setIsSaving(false);
    }

    async function deletePlayer() {
        if (!selectedPlayer) return;
        setIsDeleting(true);

        // Delete from player_details first (foreign key dependency)
        const { error: detailsError } = await supabase
            .from('player_details')
            .delete()
            .eq('id', selectedPlayer.id);

        if (detailsError) {
            console.log("Error deleting player_details:", detailsError.message);
            setIsDeleting(false);
            return;
        }

        // Then delete from signin_details
        const { error: signinError } = await supabase
            .from('signin_details')
            .delete()
            .eq('id', selectedPlayer.id);

        if (signinError) {
            console.log("Error deleting signin_details:", signinError.message);
            setIsDeleting(false);
            return;
        }

        setIsDeleting(false);
        setShowDeleteConfirm(false);
        setSelectedPlayer(null);
        fetchPlayers();
    }

    async function fetchPlayers() {
        const { data, error } = await supabase
            .from('signin_details')
            .select('*')
            .eq('role', 'player');

        if (error) {
            console.log("Error when fetching players: ", error.message);
            setPlayers([]);
        } else {
            setPlayers(data);
        }
    }

    const [playerDetails, setPlayerDetails] = useState(null);

    async function fetchSelectedPlayer(player) {
        if (!player) return;
        setIsDataLoading(true);

        const { data, error } = await supabase
            .from('player_details')
            .select('*')
            .eq('id', player.id)      
            .maybeSingle();            

        if (error) {
            console.log("Error fetching player details: ", error.message);
            setPlayerDetails(null);
        } else {
            setPlayerDetails(data);
        }
        setIsDataLoading(false);
    }

    useEffect(() => {
        if (selectedPlayer) {
            fetchSelectedPlayer(selectedPlayer);
        } else {
            setPlayerDetails(null);
        }
    }, [selectedPlayer]);

    useEffect(() => {
        fetchPlayers();
    }, []);

    return (
        <>
            {/* Loading overlay */}
            {isDataLoading && <LOADING_OVERLAY caption={"session data"}/>}

            {/* Delete confirmation popup */}
            {showDeleteConfirm && selectedPlayer && (
                <DELETE_CONFIRM
                    deleteRef={deleteConfirmRef}
                    setShowDelete={setShowDeleteConfirm}
                    selectedPlayer={selectedPlayer}
                    deletePlayer={deletePlayer}
                    isDeleting={isDeleting}
                />
            )}

            {showAddModal && selectedPlayer && (
                <ADD_STRENGTH_WEAKNESS
                    modalRef={addModalRef}
                    setShowModal={setShowAddModal}
                    type={addType}
                    onAdd={addStrengthWeakness}
                    isSaving={isSaving}
                />
            )}

            <div id="player-profile-page">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>
                            Player Profile
                        </h2>
                        <p style={{
                            fontFamily: "'DM Sans Light', sans-serif",
                            fontSize: '13px',
                            color: 'var(--content-subhead-color)'
                        }}>
                            View and edit player profiles.
                        </p>
                    </div>
                </div>

                <div id="player-profile-main">
                    {!selectedPlayer ? (
                        <div id="player-list-container">
                            <PLAYER_LIST
                                players={players || []}
                                setSelectedPlayer={setSelectedPlayer}
                            />
                        </div>
                    ) : (
                        <PLAYER_DETAILS
                            player={selectedPlayer}
                            playerDetails={playerDetails}
                            setSelectedPlayer={setSelectedPlayer}
                            setShowDeleteConfirm={setShowDeleteConfirm}
                            setPlayerDetails={setPlayerDetails}
                            setShowAddModal={setShowAddModal}
                            setAddType={setAddType}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

