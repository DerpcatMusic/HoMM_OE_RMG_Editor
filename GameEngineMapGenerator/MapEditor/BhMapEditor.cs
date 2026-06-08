using System.Runtime.CompilerServices;
using Hex.Map;
using Hex.MapEditor.NodesDrawer;
using Hex.Session.UI;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhMapEditor : MonoBehaviour, bud
	{
		public static BhMapEditor me;

		[Header("Submodules")]
		public btu nodeViewer;

		public btw waterViewer;

		public btl aggroViewer;

		public bwv areasNodeViewer;

		public btq guidingLines;

		[Header("References Objects")]
		public GameObject prefDummy;

		public GameObject prefSquad;

		public GameObject prefMarker;

		public GameObject prefZone;

		[SerializeField]
		private int UILayer;

		[SerializeField]
		private BhCommentsVIew commentsView;

		[SerializeField]
		private BhQuestListView questListView;

		[SerializeField]
		private BhBrushView brushView;

		[SerializeField]
		private BhEditorToolsGroup toolGroup;

		[SerializeField]
		private bsl itemsGroup;

		[SerializeField]
		private BhInfoObject objectInfo;

		[SerializeField]
		private BhInfoGroups groupsInfo;

		[SerializeField]
		private Camera altCamera;

		[SerializeField]
		private BhAlphaAnim alphaAnim;

		[SerializeField]
		private CanvasGroup canvasGroup;

		[SerializeField]
		private BhEditorCameraZoom altZoom;

		[Space]
		[SerializeField]
		private NodesDrawerAssets areasDrawerAssets;

		private float buik;

		private bqk buil;

		private bqm buip;

		private bqo buiq;

		private float buir;

		private bool buis;

		private bqn buit;

		private bool buiu;

		private cdm buiv;

		private bsx buiw;

		private string buiy;

		public Hex.Map.Map buie
		{
			[CompilerGenerated]
			get
			{
				return null;
			}
			[CompilerGenerated]
			private set
			{
			}
		}

		public bqu buif
		{
			[CompilerGenerated]
			get
			{
				return null;
			}
			[CompilerGenerated]
			private set
			{
			}
		}

		public bqi buig
		{
			[CompilerGenerated]
			get
			{
				return null;
			}
			[CompilerGenerated]
			private set
			{
			}
		}

		public bqw buih
		{
			[CompilerGenerated]
			get
			{
				return null;
			}
			[CompilerGenerated]
			private set
			{
			}
		}

		public bqy buii
		{
			[CompilerGenerated]
			get
			{
				return null;
			}
			[CompilerGenerated]
			private set
			{
			}
		}

		public bsc buij
		{
			[CompilerGenerated]
			get
			{
				return null;
			}
			[CompilerGenerated]
			private set
			{
			}
		}

		public MetaInfo buim
		{
			[CompilerGenerated]
			get
			{
				return null;
			}
			[CompilerGenerated]
			set
			{
			}
		}

		public bool buin
		{
			[CompilerGenerated]
			get
			{
				return false;
			}
			[CompilerGenerated]
			set
			{
			}
		}

		public bool buio
		{
			[CompilerGenerated]
			get
			{
				return false;
			}
			[CompilerGenerated]
			set
			{
			}
		}

		public BhBrushView cmnl => null;

		public BhInfoObject cmnm => null;

		public BhInfoGroups cmnn => null;

		public Camera cmno => null;

		public bqn cmnp
		{
			get
			{
				return null;
			}
			set
			{
			}
		}

		public bqj buix
		{
			[CompilerGenerated]
			get
			{
				return null;
			}
			[CompilerGenerated]
			private set
			{
			}
		}

		private void Awake()
		{
		}

		private void Start()
		{
		}

		private void Update()
		{
		}

		private void LateUpdate()
		{
		}

		public void ngi(EEditorTypes a, string b, int c)
		{
		}

		public void ngj(EEditorTools a)
		{
		}

		public void ngk()
		{
		}

		public void ngl(bqt a)
		{
		}

		public void ngm(bqt a)
		{
		}

		public void ngn()
		{
		}

		public void ngo(bool a)
		{
		}

		public void ngp()
		{
		}

		public void ngq()
		{
		}

		public void ngr(int a, byte b)
		{
		}

		public void Undo()
		{
		}

		public void ngs()
		{
		}

		public bool ngt()
		{
			return false;
		}

		public void Save(string _mapName, string _path = "", bool refreshMapName = true)
		{
		}

		public void ngu(string a, string b = "")
		{
		}

		public void Load(MapData _mapData)
		{
		}

		public void Load(pv fileHandle)
		{
		}

		public void ngv(int a, int b, string c, string d)
		{
		}

		public void ngw(string a, int b)
		{
		}

		public bqn ngx()
		{
			return null;
		}

		public void ngy()
		{
		}

		public void ngz(int a)
		{
		}

		public void nha(int a)
		{
		}

		public void nhb()
		{
		}

		private void nhc()
		{
		}

		private void nhd()
		{
		}

		private void nhe()
		{
		}

		private void nhf()
		{
		}
	}
}
