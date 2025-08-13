namespace TCCControleDeAcesso.Views
{
    partial class frmExcluir
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.acao = new System.Windows.Forms.Label();
            this.btnExcluir = new System.Windows.Forms.Button();
            this.txtExcluir = new System.Windows.Forms.TextBox();
            this.SuspendLayout();
            // 
            // acao
            // 
            this.acao.AutoSize = true;
            this.acao.Location = new System.Drawing.Point(320, 334);
            this.acao.Name = "acao";
            this.acao.Size = new System.Drawing.Size(35, 13);
            this.acao.TabIndex = 0;
            this.acao.Text = "label1";
            // 
            // btnExcluir
            // 
            this.btnExcluir.Location = new System.Drawing.Point(323, 277);
            this.btnExcluir.Name = "btnExcluir";
            this.btnExcluir.Size = new System.Drawing.Size(75, 23);
            this.btnExcluir.TabIndex = 1;
            this.btnExcluir.Text = "Excluir";
            this.btnExcluir.UseVisualStyleBackColor = true;
            this.btnExcluir.Click += new System.EventHandler(this.btnExcluir_Click);
            // 
            // txtExcluir
            // 
            this.txtExcluir.Location = new System.Drawing.Point(353, 211);
            this.txtExcluir.Name = "txtExcluir";
            this.txtExcluir.Size = new System.Drawing.Size(100, 20);
            this.txtExcluir.TabIndex = 2;
            // 
            // frmExcluir
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1264, 681);
            this.Controls.Add(this.txtExcluir);
            this.Controls.Add(this.btnExcluir);
            this.Controls.Add(this.acao);
            this.Name = "frmExcluir";
            this.Text = "frmExcluir";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label acao;
        private System.Windows.Forms.Button btnExcluir;
        private System.Windows.Forms.TextBox txtExcluir;
    }
}