import { useState, useRef } from "react";
import { Upload, Camera, ImagePlus } from "lucide-react";
import ".././../styles/ImageSearch.css";

const ImageSearch = () => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleImageChange = (file) => {
    if (file) {
      setSelectedImage(file); // Store the file
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageChange(file);
    } else {
      setError("Please drop an image file");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      setError("Please upload an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      setLoading(true);
      setError("");
      const response = await fetch("http://localhost:5000/api/recognize", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        let parsedResult;

        // Clean up markdown if needed
        const cleaned = data.result.replace(/```json|```/g, "").trim();

        try {
          parsedResult = JSON.parse(cleaned);
        } catch (err) {
          setError("Invalid format received from server.");
          console.error("Parsing error:", err);
          return;
        }

        setIngredients(parsedResult);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setError("Image recognition failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyIngredients = () => {
    const ingredientsText = ingredients.join(', ');
    navigator.clipboard.writeText(ingredientsText)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => setError('Failed to copy ingredients'));
  };

  return (
    <div className="image-search-container">
      <h1 className="image-search-title">Ingredient Image Recognition</h1>

      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e.target.files[0])}
          className="file-input"
          ref={fileInputRef}
        />
        <div className="drop-zone-content">
          <Upload size={40} />
          <p>Drag & drop an image here or click to select</p>
        </div>
      </div>

      {previewUrl && (
        <img src={previewUrl} alt="Preview" className="preview-image" />
      )}

      <button
        type="submit"
        disabled={loading || !previewUrl}
        className="submit-button"
        onClick={handleSubmit}
      >
        {loading ? (
          <>
            <div className="loading-spinner" />
            Recognizing...
          </>
        ) : (
          <>
            <ImagePlus size={20} />
            Identify Ingredients
          </>
        )}
      </button>

      {error && <p className="error-message">{error}</p>}

      {ingredients.length > 0 && (
        <div className="ingredients-list">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2>Identified Ingredients:</h2>
            <button
              onClick={handleCopyIngredients}
              className="copy-button"
              style={{
                padding: '8px 16px',
                backgroundColor: copySuccess ? '#4CAF50' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.3s'
              }}
            >
              {copySuccess ? 'Copied!' : 'Copy Ingredients'}
            </button>
          </div>
          <ul>
            {ingredients.map((item, index) => (
              <li key={index}>
                <Upload size={16} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageSearch;
