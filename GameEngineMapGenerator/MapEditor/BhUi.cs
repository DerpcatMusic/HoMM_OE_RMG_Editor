using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhUi : MonoBehaviour
	{
		public static BhUi me;

		[Header("Resources for EditorUI")]
		public Sprite missIcon;

		[Header("Panels")]
		public bqr topPanel;

		public BhSaveLoad mapSaveLoad;

		public BhNewMap mapNew;

		public BhMapSettings mapSettings;

		public bqp objectPreview;

		public BhBrushView brushView;

		[SerializeField]
		private BhPropertiesWindow propertiesWindow;

		[SerializeField]
		public BhSelectorView selectorView;

		[SerializeField]
		private BhSpawnWindow spawnWindow;

		[SerializeField]
		private BhMapEditorGizoms gizmos;

		[SerializeField]
		private BhQuestContentsController questController;

		[SerializeField]
		private BhEditorConfigSearchWindow search;

		[SerializeField]
		private TextMeshProUGUI cursorCoords;

		public bsg togglesView;

		[Space]
		public Toggle gridToggle;

		public Toggle camToggle;

		public Toggle pathToggle;

		public Toggle areaToggle;

		private bool bujx;

		public bool cmnq
		{
			get
			{
				return false;
			}
			set
			{
			}
		}

		private void Awake()
		{
		}

		public void nio()
		{
		}

		public void ShowSpawnWindow()
		{
		}

		public void PlayThisMap()
		{
		}

		public void OnToggleGird(bool _v)
		{
		}

		public void OnTogglePath(bool _v)
		{
		}

		public void OnTogglePath()
		{
		}

		public void OnToggleArea(bool _v)
		{
		}

		public void OnToggleWater(bool _v)
		{
		}

		public void OnToggleArea()
		{
		}

		public void OnToggleAggro(bool _v)
		{
		}

		public void OnToggleCam(bool _v)
		{
		}

		public void OnToggleQuest(bool _v)
		{
		}

		public void OnToggleGuides(bool _v)
		{
		}

		public void SelectObject(bqn _edObj)
		{
		}

		public void Deselect()
		{
		}

		public void nip(bqn a)
		{
		}

		public void niq(bool a)
		{
		}

		public void nir(int a, int b, int c)
		{
		}
	}
}
