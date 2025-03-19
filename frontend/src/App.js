import React, { use, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";
import StarRating from "./components/StarRating/StarRating";
import AddRecipeModal from "./components/AddRecipeModal/AddRecipeModal";
import RecipeDetail from "./components/RecipeDetail/RecipeDetail";
import API_URL from './api/config';


export function RecipeButton({ images}){
    const [hoveredImage, setHoveredImage] = useState(null);
    const navigate = useNavigate();

    const handleMouseEnter = (id) => {
      setHoveredImage(id);
    };
  
    const handleMouseLeave = () => {
      setHoveredImage(null);
    };  

    const handleRecipeClick = (recipe) => {
        navigate(`/${recipe.id}`);
    };

    return (
    <div className="recipe-grid">
        {images.map((image, index) => (
            <button
                key={index}
                className="Big-button"
                style={{
                    backgroundImage: `url(/static/${image.Image_path})`,
                }}
                onMouseEnter={() => handleMouseEnter(image.id)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleRecipeClick(image)}>
                {hoveredImage === image.id && (
                <div className="hover-all">
                    <div className="hover-text">{String(image.Name).charAt(0).toUpperCase() + String(image.Name).slice(1)}</div>
                    <div className="hover-image"></div>
                    <div className="hover-date">{String(image.date.substr(0, 3) + "  " + image.date.substr(3)).split(" ").slice(1).join(" ")}</div>
                    <div className="hover-rating"><StarRating rating={image.Rating}/></div>
                </div>
                )}
            </button>
        ))}
    </div>
    );
};

export function TopBar(){
    const [showModal, setShowModal] = useState(false);
    
    const handleAddRecipeClick = () => {
        setShowModal(true);
    };
    
    const handleCloseModal = () => {
        setShowModal(false);
    };
    
    return (
        <div className="Top-bar">
            <div className="Logo-section">
                <button className="Logo-tag"></button>
                <button className="Logo-name">BroIsCooked</button>
            </div>
            
            <div className="search">
                <input 
                    className="Search-input" 
                    type="text" 
                    placeholder="Search recipe" 
                />
            </div>
            
            <div className="nav-links">
                <button className="All-recipes">ALL-RECIPES</button>
                <button className="Dairy">DAIRY</button>
                <button className="Add-recipe" onClick={handleAddRecipeClick}>
                    <p className="Add-p">+</p>ADD RECIPE
                </button>
            </div>
            
            <div className="User-section">
                <button className="User-acc"></button>
                <button className="User-text">DT</button>
            </div>
            
            {showModal && <AddRecipeModal onClose={handleCloseModal} onAddRecipe={() => window.location.reload()} />}
        </div>
    )
}

export function BannerText(){
    return (
    <div>
        <button className="BannerImg"></button>
        <div className="Banner-text">Welcome Back <span className="Bt-span"> Dhananjay</span>, Look how you massacred all these boys...</div>
    </div>
    )
}

const Dropdown = ({ title, options }) => {
  const [open, setOpen] = useState(false);
  const ic_val = (title === "Sort by") ? "sby-icon" : "icon";
  console.log(ic_val);
  return (
    <div className="dropdown" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button>
        {title} <span className={ic_val}>▼</span>
      </button>
      {open && (
        <div className="dropdown-content">
          {options.map((option, index) => (
            <a key={index} href="#" onClick={() => setOpen(false)}>
              {option}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export function FilterBar() {
  return (
    <div className="container">
      <hr className="hr-1" />
      <div className="filters">
        <Dropdown title="CUISINE" options={["USA", "UK", "India"]} />
        <Dropdown title="TYPE" options={["Available", "Out of Stock", "New Arrivals"]} />
        <Dropdown title="YEAR" options={["Available", "Out of Stock", "New Arrivals"]} />
        <Dropdown title="FILTER" options={["Available", "Out of Stock", "New Arrivals"]} />
        <Dropdown title="Sort by" options={["Price", "Date", "Popularity"]} />
        
      </div>
      <hr className="hr-2" />
    </div>
  );
}

// Add this class above your App component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>Error: {this.state.error?.toString()}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    console.log(`${API_URL}/recipes`);
    const fetchRecipes = () => {
        fetch(`${API_URL}/recipes`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text(); // First get the response as text
            })
            .then(text => {
                try {
                    const data = JSON.parse(text); // Try to parse it as JSON
                    setRecipes(data);
                    setLoading(false);
                } catch (e) {
                    console.error('Failed to parse JSON:', e);
                    console.error('Response text:', text);
                    throw new Error('Invalid JSON received');
                }
            })
            .catch(error => {
                console.error('Error fetching recipes:', error);
                setLoading(false);
            });
    };
    
    useEffect(() => {
        fetchRecipes();
        
        // Listen for recipe updates
        const handleRecipeUpdate = () => {
            fetchRecipes();
        };
        
        window.addEventListener('recipe-updated', handleRecipeUpdate);
        
        return () => {
            window.removeEventListener('recipe-updated', handleRecipeUpdate);
        };
    }, []);
    
    return (
        <ErrorBoundary>
            <Router>
                <TopBar />
                <Routes>
                    <Route path="/" element={
                        <>
                            <BannerText />
                            <FilterBar />
                            {loading ? (
                                <div className="loading">Loading recipes...</div>
                            ) : (
                                <RecipeButton images={recipes}/>
                            )}
                        </>
                    } />
                    <Route path="/:id" element={<RecipeDetail recipes={recipes} />} />
                </Routes>
            </Router>
        </ErrorBoundary>
    );
}

