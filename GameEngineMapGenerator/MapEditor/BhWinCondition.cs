using System;
using System.Runtime.CompilerServices;
using Hex.Map;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhWinCondition : MonoBehaviour
	{
		[SerializeField]
		private TextMeshProUGUI text;

		[SerializeField]
		private Toggle toggle;

		[SerializeField]
		private TypeWinCondition winCondition;

		public virtual string cmph
		{
			get
			{
				return null;
			}
			set
			{
			}
		}

		public TypeWinCondition cmpi => default(TypeWinCondition);

		public bool cmpj
		{
			get
			{
				return false;
			}
			set
			{
			}
		}

		private event Action buxr
		{
			[CompilerGenerated]
			add
			{
			}
			[CompilerGenerated]
			remove
			{
			}
		}

		public void Awake()
		{
		}

		public virtual void nxt(Action a)
		{
		}

		protected void OnChange()
		{
		}

		[CompilerGenerated]
		private void nxu(bool a)
		{
		}
	}
}
